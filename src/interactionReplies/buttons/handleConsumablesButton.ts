import { Context } from 'hono';
import { BASE_URL } from '../../objects/config/constants';
import { TypeItem } from '../../objects/enums/TypeItem';
import { InventoryItemView, getInventoryItems } from '../../services/inventoryService';

const EPHEMERAL_FLAG = 1 << 6;
const DISPLAY_LIMIT = 12;

function formatType(type: TypeItem | null, fr: boolean): string {
  if (!type) {
    return fr ? 'inconnu' : 'unknown';
  }

  if (fr) {
    switch (type) {
      case TypeItem.Potion:
        return 'potion';
      case TypeItem.Chrono:
        return 'chrono';
      case TypeItem.Stone:
        return 'pierre';
      case TypeItem.Scroll:
        return 'parchemin';
      default:
        return 'inconnu';
    }
  }

  return type;
}

function formatRarity(rarity: string | null, fr: boolean): string {
  if (!rarity) {
    return fr ? 'inconnue' : 'unknown';
  }

  if (!fr) {
    return rarity;
  }

  switch (rarity) {
    case 'basic':
      return 'basique';
    case 'gold':
      return 'doré';
    case 'epic':
      return 'epique';
    case 'silver':
      return 'argent';
    case 'bronze':
      return 'bronze';
    default:
      return rarity;
  }
}

export function buildConsumablesDescription(
  items: InventoryItemView[],
  fr: boolean,
  userId: string
): string {
  const consumables = items.filter(item => item.category === 'consumable');

  if (consumables.length === 0) {
    return fr
      ? `# Consommables\n\nAucun consommable disponible pour le moment.\n\nTu peux consulter ton inventaire complet ici:\n${BASE_URL}/inventory/${userId}?lang=fr`
      : `# Consumables\n\nNo consumables available right now.\n\nYou can view your full inventory here:\n${BASE_URL}/inventory/${userId}?lang=en`;
  }

  const rows = consumables.slice(0, DISPLAY_LIMIT).map(item => {
    const name = fr ? item.nameFr : item.nameEn;
    const rarity = formatRarity(item.rarity, fr);
    const type = formatType(item.consumableType, fr);
    return `- ${name} x${item.quantity} (${type}, ${rarity})`;
  });

  const moreCount = Math.max(0, consumables.length - DISPLAY_LIMIT);
  const moreLine =
    moreCount > 0
      ? fr
        ? `\n... et ${moreCount} autre(s)`
        : `\n... and ${moreCount} more`
      : '';

  const header = fr
    ? `# Consommables (${consumables.length})`
    : `# Consumables (${consumables.length})`;
  const footer = fr
    ? `\n\nInventaire complet:\n${BASE_URL}/inventory/${userId}?lang=fr`
    : `\n\nFull inventory:\n${BASE_URL}/inventory/${userId}?lang=en`;

  return `${header}\n\n${rows.join('\n')}${moreLine}${footer}`;
}

export async function handleConsumablesButton(
  c: Context,
  userId: string,
  fr: boolean
) {
  const items = await getInventoryItems(userId);
  const description = buildConsumablesDescription(items, fr, userId);

  return c.json({
    type: 4,
    data: {
      content: description,
      flags: EPHEMERAL_FLAG,
    },
  });
}
