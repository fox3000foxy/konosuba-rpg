import { Context } from 'hono';
import { BASE_URL } from '../../objects/config';
import { AccessoryId } from '../../objects/enums/AccessoryId';
import { Button } from '../../objects/enums/Button';
import { ItemId } from '../../objects/enums/ItemId';
import { Rarity } from '../../objects/enums/Rarity';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';
import { ShopItem } from '../../objects/types/ShopItem';
import { getItemById as getAccessoryById, getItemByName as getAccessoryByName, getItems as getAllAccessories } from '../../services/accessoryService';
import { getItems as getAllConsumables, getItemById as getConsumableById, getItemByName as getConsumableByName } from '../../services/consumableService';
import { consumeInventoryItem, getInventoryItemQuantity } from '../../services/inventoryConsumptionService';
import { addInventoryItem } from '../../services/inventoryService';
import { ensurePlayerProfile, getPlayerProfile, updatePlayerGold } from '../../services/playerService';
import { addImageVersion } from '../../utils/imageUtils';

const SHOP_CATALOG_KEYS: Array<AccessoryId | ItemId> = [...Object.values(AccessoryId), ...Object.values(ItemId)];

export function getPriceFromRarity(rarity: Rarity, itemType: 'accessory' | 'consumable'): number {
  const base = itemType === 'accessory' ? 90 : 40;
  const multiplier: Record<Rarity, number> = {
    [Rarity.Basic]: 1,
    [Rarity.Bronze]: 1.2,
    [Rarity.Silver]: 1.6,
    [Rarity.Gold]: 2.5,
    [Rarity.Epic]: 4,
  };
  return Math.max(1, Math.round(base * multiplier[rarity]));
}

function normalizeShopInput(input: string | AccessoryId | ItemId): string {
  return String(input).trim().toLowerCase();
}

function toShopItemFromAccessory(accessory: NonNullable<ReturnType<typeof getAccessoryById>>): ShopItem {
  return {
    itemKey: accessory.id,
    itemType: 'accessory',
    nameFr: accessory.nameFr,
    nameEn: accessory.nameEn,
    price: getPriceFromRarity(accessory.rarity, 'accessory'),
  };
}

function toShopItemFromConsumable(consumable: NonNullable<ReturnType<typeof getConsumableById>>): ShopItem {
  return {
    itemKey: consumable.id,
    itemType: 'consumable',
    nameFr: consumable.nameFr,
    nameEn: consumable.nameEn,
    price: getPriceFromRarity(consumable.rarity, 'consumable'),
  };
}

export function getShopItem(itemKeyOrName: string | AccessoryId | ItemId): ShopItem | null {
  const normalized = normalizeShopInput(itemKeyOrName);

  const accessory = getAccessoryById(normalized as AccessoryId) || getAccessoryByName(normalized);
  if (accessory) {
    return toShopItemFromAccessory(accessory);
  }

  const consumable = getConsumableById(normalized as ItemId) || getConsumableByName(normalized);
  if (consumable) {
    return toShopItemFromConsumable(consumable);
  }

  const directFromCatalog = SHOP_CATALOG_KEYS.find(key => normalizeShopInput(key) === normalized);
  if (directFromCatalog) {
    const accessoryFromCatalog = getAccessoryById(directFromCatalog as AccessoryId);
    if (accessoryFromCatalog) {
      return toShopItemFromAccessory(accessoryFromCatalog);
    }

    const consumableFromCatalog = getConsumableById(directFromCatalog as ItemId);
    if (consumableFromCatalog) {
      return toShopItemFromConsumable(consumableFromCatalog);
    }
  }

  return null;
}

function getOptionValue(options: InteractionDataOption[] | undefined, name: string) {
  const option = options?.find(o => o.name === name);
  return option ? String(option.value).trim() : '';
}

const MAX_CUSTOM_ID_LENGTH = 100;
const MAX_SELECT_OPTIONS = 25;
const MAX_OPTION_LABEL = 100;
const MAX_OPTION_VALUE = 100;

function sanitizeComponentId(value: string) {
  return String(value).slice(0, MAX_CUSTOM_ID_LENGTH);
}

function sanitizeOptionLabel(value: string) {
  return String(value).trim().slice(0, MAX_OPTION_LABEL);
}

function sanitizeOptionValue(value: string) {
  return String(value).trim().slice(0, MAX_OPTION_VALUE);
}

export function buildShopComponents(items: ShopItem[], page: number, pageCount: number, fr: boolean, userId: string, selectedItemKey?: string) {
  const safeUserId = sanitizeComponentId(userId);
  const safePage = Math.max(1, page);
  const safePageCount = Math.max(1, pageCount);

  const arrowBack = {
    type: 2,
    label: '<',
    style: 2,
    custom_id: sanitizeComponentId(`shop_backward:${Math.max(1, safePage - 1)}:${safeUserId}`),
    disabled: safePage <= 1,
  };
  const arrowForward = {
    type: 2,
    label: '>',
    style: 2,
    custom_id: sanitizeComponentId(`shop_forward:${Math.min(safePageCount, safePage + 1)}:${safeUserId}`),
    disabled: safePage >= safePageCount,
  };

  const options = items.slice(0, 1000).map(item => ({
    label: sanitizeOptionLabel(fr ? item.nameFr : item.nameEn),
    value: sanitizeOptionValue(String(item.itemKey)),
    description: `${item.price} gold`.slice(0, 100),
  }));

  const selectHasOptions = options.length > 0;
  const selectOptions = selectHasOptions
    ? options.slice(0, MAX_SELECT_OPTIONS)
    : [
        {
          label: fr ? 'Aucun objet disponible' : 'No items available',
          value: 'none',
          description: '',
        },
      ];

  const selectComponent = {
    type: 3,
    custom_id: sanitizeComponentId(`shop_select:${safePage}:${safeUserId}`),
    options: selectOptions,
    placeholder: fr ? 'Choisir un objet' : 'Choose an item',
    min_values: selectHasOptions ? 1 : 0,
    max_values: 1,
    disabled: !selectHasOptions,
  };

  const mainButtons = [arrowBack, arrowForward];

  const bottomButtons: Button[] = [];

  if (selectedItemKey) {
    bottomButtons.push({
      type: 2,
      label: fr ? 'Acheter' : 'Buy',
      style: 3,
      custom_id: sanitizeComponentId(`shop_buy:${sanitizeOptionValue(selectedItemKey)}:${safePage}:${safeUserId}`),
      disabled: !selectHasOptions,
    });

    bottomButtons.push({
      type: 2,
      label: fr ? 'Retour' : 'Back',
      style: 2,
      custom_id: sanitizeComponentId(`shop_back:${safePage}:${safeUserId}`),
    });
  }

  return [{ type: 1, components: mainButtons }, { type: 1, components: [selectComponent] }, bottomButtons.length > 0 ? { type: 1, components: bottomButtons } : null].filter((v): v is NonNullable<typeof v> => !!v);
}

export async function handleShopCommand(c: Context, userId: string, fr: boolean, options?: InteractionDataOption[]) {
  await ensurePlayerProfile(userId);

  const action = (getOptionValue(options, 'action') || 'items').toLowerCase();
  const format = (getOptionValue(options, 'format') || 'image').toLowerCase();
  const pageValue = Number(getOptionValue(options, 'page')) || 1;
  const page = Math.max(1, pageValue);
  const itemInput = getOptionValue(options, 'item');
  const quantityValue = Number(getOptionValue(options, 'quantity')) || 1;
  const quantity = Math.max(1, Math.min(quantityValue, 99));

  if (action === 'items' || action === 'list' || action === 'view') {
    const accessoryItems = getAllAccessories().map(toShopItemFromAccessory);
    const consumableItems = getAllConsumables().map(toShopItemFromConsumable);
    const allShopItems = [...accessoryItems, ...consumableItems];
    const pageSize = 16;
    const pageCount = Math.max(1, Math.ceil(allShopItems.length / pageSize));
    const pageIndex = Math.min(pageCount - 1, page - 1);
    const itemsOnPage = allShopItems.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

    if (format === 'image') {
      const imageUrl = addImageVersion(`${BASE_URL}/shop/${page}?lang=${fr ? 'fr' : 'en'}`);
      console.log(`[ShopCommand] Generated shop image URL: ${imageUrl}`);
      const description = fr ? `Voici la page ${page} de la boutique (${pageCount}).` : `Page ${page} of shop (${pageCount}).`;

      let components: unknown = [];
      try {
        components = buildShopComponents(itemsOnPage, page, pageCount, fr, userId);
      } catch (eventError) {
        console.error('[ShopCommand] buildShopComponents failed:', eventError);
      }

      return c.json({
        type: 4,
        data: {
          embeds: [
            {
              title: fr ? 'Boutique' : 'Shop',
              description,
              image: { url: imageUrl },
              color: 0x2b2d31,
            },
          ],
          components,
        },
      });
    }

    const list = itemsOnPage.map(item => `${fr ? item.nameFr : item.nameEn} (${item.itemKey}) - ${item.price} gold`).join('\n');

    return c.json({
      type: 4,
      data: {
        embeds: [
          {
            description: fr ? `# Boutique\n\n${list}` : `# Shop\n\n${list}`,
            color: 0x2b2d31,
          },
        ],
      },
    });
  }

  if (!itemInput) {
    return c.json({
      type: 4,
      data: {
        content: fr ? 'Indique un objet avec `item:` pour acheter/vendre.' : 'Specify an item with `item:` to buy/sell.',
        flags: 1 << 6,
      },
    });
  }

  const shopItem = getShopItem(itemInput);
  if (!shopItem || shopItem.itemType === 'unknown') {
    return c.json({
      type: 4,
      data: {
        content: fr ? 'Objet indisponible en boutique.' : 'Item not available in shop.',
        flags: 1 << 6,
      },
    });
  }

  const profile = await getPlayerProfile(userId);
  if (!profile) {
    return c.json({
      type: 4,
      data: {
        content: fr ? 'Profil indisponible pour le moment.' : 'Player profile is unavailable right now.',
        flags: 1 << 6,
      },
    });
  }

  if (action === 'buy') {
    const cost = shopItem.price * quantity;
    if (profile.gold < cost) {
      return c.json({
        type: 4,
        data: {
          content: fr ? `Tu n'as pas assez d'or (${profile.gold} < ${cost}).` : `Not enough gold (${profile.gold} < ${cost}).`,
          flags: 1 << 6,
        },
      });
    }

    const updatedGold = await updatePlayerGold(userId, -cost);
    if (updatedGold === null) {
      return c.json({
        type: 4,
        data: {
          content: fr ? "Impossible de mettre à jour l'or. Essaie plus tard." : 'Unable to update gold. Try again later.',
          flags: 1 << 6,
        },
      });
    }

    const added = await addInventoryItem(userId, shopItem.itemKey, shopItem.itemType, quantity);

    if (!added) {
      return c.json({
        type: 4,
        data: {
          content: fr ? "Impossible d'ajouter l'objet à l'inventaire." : 'Unable to add item to inventory.',
          flags: 1 << 6,
        },
      });
    }

    return c.json({
      type: 4,
      data: {
        content: fr ? `✅ Acheté ${quantity} x ${shopItem.nameFr} pour ${cost} or. Tu as maintenant ${updatedGold} or.` : `✅ Bought ${quantity} x ${shopItem.nameEn} for ${cost} gold. You now have ${updatedGold} gold.`,
        flags: 1 << 6,
      },
    });
  }

  if (action === 'sell') {
    const owned = await getInventoryItemQuantity(userId, shopItem.itemKey);
    if (owned < quantity) {
      return c.json({
        type: 4,
        data: {
          content: fr ? `Tu n'as pas assez d'objets (${owned} disponible(s)).` : `You don't have enough items (${owned} available).`,
          flags: 1 << 6,
        },
      });
    }

    const consumed = await consumeInventoryItem(userId, shopItem.itemKey, quantity);
    if (!consumed) {
      return c.json({
        type: 4,
        data: {
          content: fr ? "Impossible de vendre l'objet; vérifie ton inventaire." : 'Unable to sell item; check your inventory.',
          flags: 1 << 6,
        },
      });
    }

    const gain = Math.floor((shopItem.price * quantity) / 2);
    const updatedGold = await updatePlayerGold(userId, gain);

    if (updatedGold === null) {
      return c.json({
        type: 4,
        data: {
          content: fr ? "Impossible de mettre à jour l'or après vente." : 'Unable to update gold after selling.',
          flags: 1 << 6,
        },
      });
    }

    return c.json({
      type: 4,
      data: {
        content: fr ? `✅ Vendu ${quantity} x ${shopItem.nameFr} pour ${gain} or. Tu as maintenant ${updatedGold} or.` : `✅ Sold ${quantity} x ${shopItem.nameEn} for ${gain} gold. You now have ${updatedGold} gold.`,
        flags: 1 << 6,
      },
    });
  }

  return c.json({
    type: 4,
    data: {
      content: fr ? "Action invalide: utilise 'items', 'buy' ou 'sell'." : "Invalid action: use 'items', 'buy', or 'sell'.",
      flags: 1 << 6,
    },
  });
}
