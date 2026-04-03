import { Context } from 'hono';
import { BASE_URL } from '../../objects/config';
import { AccessoryId } from '../../objects/enums/AccessoryId';
import { AccessoryType } from '../../objects/enums/AccessoryType';
import { CharacterKey } from '../../objects/enums/CharacterKey';
import { Interaction } from '../../objects/enums/Interaction';
import { ItemId } from '../../objects/enums/ItemId';
import { Lang } from '../../objects/enums/Lang';
import { Rarity } from '../../objects/enums/Rarity';
import { RecordRunInput } from '../../objects/types/RecordRunInput';
import { ShopItem } from '../../objects/types/ShopItem';
import { decodeGameplayPayloadWithStatus } from '../../services/gameSessionService';
import { donateAccessoryToCharacter, ensurePlayerProfile, getAchievementsOverview, recordRunResult } from '../../services/progressionService';
import { addImageVersion } from '../../utils/imageUtils';
import { decompressMoves } from '../../utils/movesUtils';
import { extractDifficulty, isTraining } from '../../utils/payloadUtils';

const RECORD_RUN_RESULT_TIMEOUT_MS = 3000;

function persistRunResultInBackground(input: RecordRunInput): void {
  const writePromise = recordRunResult(input).catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[db] recordRunResult failed for user=${input.userId}:`, message);
  });

  const timeoutPromise = new Promise<void>((_, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(new Error(`recordRunResult timed out after ${RECORD_RUN_RESULT_TIMEOUT_MS}ms`));
    }, RECORD_RUN_RESULT_TIMEOUT_MS);
  });

  void Promise.race([writePromise, timeoutPromise]).catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[db] recordRunResult background warning for user=${input.userId}:`, message);
  });
}

async function getPagedShopItems(page: number) {
  const pageSize = 16;
  const { getShopItem } = await import('../commands/shop.js');
  const allShopItems = [...Object.values(AccessoryId), ...Object.values(ItemId)].map(key => getShopItem(key)).filter((item): item is ShopItem => Boolean(item));

  const pageCount = Math.max(1, Math.ceil(allShopItems.length / pageSize));
  const pageIndex = Math.min(pageCount - 1, Math.max(0, page - 1));
  const pageItems = allShopItems.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

  return { allShopItems, pageCount, pageItems };
}

export async function handleButtonInteraction(c: Context, interaction: Interaction, userID: string, lang: Lang, fr: boolean) {
  if (!interaction.data?.custom_id) {
    return c.json({ error: 'Unknown interaction' }, 400);
  }

  const customId: string = interaction.data.custom_id;

  if (customId.startsWith('affinity_select_type:')) {
    const parts = customId.split(':');
    const requestUserId = parts[1] || '';
    const selectedType = interaction.data.values?.[0];

    if (!selectedType || requestUserId !== userID) {
      return c.json({ type: 6 });
    }

    if (!Object.values(AccessoryType).includes(selectedType as AccessoryType)) {
      return c.json({ type: 6 });
    }

    const { buildAffinityGiftComponents } = await import('../commands/affinity.js');
    const components = await buildAffinityGiftComponents(userID, fr, {
      accessoryType: selectedType as AccessoryType,
    });

    return c.json({
      type: 7,
      data: {
        components,
      },
    });
  }

  if (customId.startsWith('affinity_select_rarity:')) {
    const parts = customId.split(':');
    const selectedTypeRaw = parts[1] || 'all';
    const requestUserId = parts[2] || '';
    const selectedRarity = interaction.data.values?.[0];

    if (!selectedRarity || requestUserId !== userID) {
      return c.json({ type: 6 });
    }

    if (!Object.values(Rarity).includes(selectedRarity as Rarity)) {
      return c.json({ type: 6 });
    }

    const selectedType = selectedTypeRaw !== 'all' && Object.values(AccessoryType).includes(selectedTypeRaw as AccessoryType) ? (selectedTypeRaw as AccessoryType) : undefined;

    const { buildAffinityGiftComponents } = await import('../commands/affinity.js');
    const components = await buildAffinityGiftComponents(userID, fr, {
      accessoryType: selectedType,
      rarity: selectedRarity as Rarity,
    });

    return c.json({
      type: 7,
      data: {
        components,
      },
    });
  }

  if (customId.startsWith('affinity_select_item:')) {
    const parts = customId.split(':');
    const requestUserId = parts[3] || '';
    const itemKey = interaction.data.values?.[0] || '';

    if (!itemKey || requestUserId !== userID) {
      return c.json({ type: 6 });
    }

    const components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: 'Darkness',
            style: 2,
            custom_id: `affinity_gift_apply:${itemKey}:${CharacterKey.Darkness}:${userID}`,
          },
          {
            type: 2,
            label: 'Megumin',
            style: 4,
            custom_id: `affinity_gift_apply:${itemKey}:${CharacterKey.Megumin}:${userID}`,
          },
          {
            type: 2,
            label: 'Aqua',
            style: 1,
            custom_id: `affinity_gift_apply:${itemKey}:${CharacterKey.Aqua}:${userID}`,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            label: fr ? 'Annuler' : 'Cancel',
            style: 2,
            custom_id: `affinity_gift_back:${userID}`,
          },
        ],
      },
    ];

    return c.json({
      type: 7,
      data: {
        components,
      },
    });
  }

  if (customId.startsWith('affinity_gift_back:')) {
    const parts = customId.split(':');
    const requestUserId = parts[1] || '';

    if (requestUserId !== userID) {
      return c.json({ type: 6 });
    }

    const { buildAffinityGiftComponents } = await import('../commands/affinity.js');
    const components = await buildAffinityGiftComponents(userID, fr);
    return c.json({
      type: 7,
      data: {
        components,
      },
    });
  }

  if (customId.startsWith('achievements_page:')) {
    try {
      const parts = customId.split(':');
      const pageRaw = parts[1] || '1';
      const requestUserId = parts[2] || '';

      if (requestUserId !== userID) {
        return c.json({ type: 6 });
      }

      await ensurePlayerProfile(userID);
      const achievements = await getAchievementsOverview(userID, fr);
      if (!achievements) {
        return c.json({ type: 6 });
      }

      const pageSize = 5;
      const pageCount = Math.max(1, Math.ceil(achievements.length / pageSize));
      const page = Math.min(pageCount, Math.max(1, Number(pageRaw) || 1));
      const unlockedCount = achievements.filter(item => item.unlocked).length;

      const { buildAchievementsComponents } = await import('../commands/achievements.js');
      const components = buildAchievementsComponents(page, pageCount, userID, fr);

      const description = fr ? `# Achievements de <@${userID}>\n\nProgression: **${unlockedCount}/${achievements.length}**\nPage: **${page}/${pageCount}**` : `# <@${userID}> achievements\n\nProgress: **${unlockedCount}/${achievements.length}**\nPage: **${page}/${pageCount}**`;

      return c.json({
        type: 7,
        data: {
          embeds: [
            {
              description,
              image: {
                url: addImageVersion(`${BASE_URL}/achievements/${userID}?lang=${fr ? 'fr' : 'en'}&page=${page}`),
              },
              color: 0x2b2d31,
            },
          ],
          components,
        },
      });
    } catch (error) {
      console.error('[achievements_page] error:', error);
      return c.json({ type: 6 });
    }
  }

  if (customId.startsWith('shop_forward:') || customId.startsWith('shop_backward:') || customId.startsWith('shop_back:') || customId.startsWith('shop_page:')) {
    try {
      const parts = customId.split(':');
      const pageRaw = parts[1] || '1';
      const requestUserId = parts[2] || '';
      if (requestUserId !== userID) {
        console.log('Unauthorized shop navigation attempt', {
          customId,
          userID,
        });
        return c.json({ type: 6 });
      }

      const page = Math.max(1, Number(pageRaw) || 1);
      const { buildShopComponents } = await import('../commands/shop.js');
      const { pageCount, pageItems } = await getPagedShopItems(page);
      const components = buildShopComponents(pageItems, page, pageCount, fr, userID);

      return c.json({
        type: 7,
        data: {
          embeds: [
            {
              title: fr ? 'Boutique' : 'Shop',
              description: fr ? `Page ${page} / ${pageCount}` : `Page ${page} / ${pageCount}`,
              image: {
                url: addImageVersion(`${BASE_URL}/shop/${page}?lang=${fr ? 'fr' : 'en'}`),
              },
              color: 0x2b2d31,
            },
          ],
          components,
        },
      });
    } catch (error) {
      console.error('[shop_page] error:', error);
      return c.json({ type: 6 });
    }
  }

  if (customId.startsWith('shop_select:')) {
    try {
      const parts = customId.split(':');
      const pageRaw = parts[1] || '1';
      const requestUserId = parts[2] || '';
      if (requestUserId !== userID) {
        return c.json({ type: 6 });
      }

      const selectedItemKey = interaction.data.values?.[0];
      const page = Math.max(1, Number(pageRaw) || 1);
      const { buildShopComponents, getShopItem } = await import('../commands/shop.js');
      const { pageCount, pageItems } = await getPagedShopItems(page);
      const components = buildShopComponents(pageItems, page, pageCount, fr, userID, selectedItemKey);

      console.log(addImageVersion(`${BASE_URL}/shop/${page}?lang=${fr ? 'fr' : 'en'}`));
      const selectedItemName = selectedItemKey ? getShopItem(selectedItemKey)?.nameEn || selectedItemKey : fr ? 'aucun' : 'none';
      const description = fr ? `Page ${page} / ${pageCount}.\n\n Objet sélectionné : ${selectedItemName}` : `Page ${page} / ${pageCount}.\n\n Selected item: ${selectedItemName}`;
      return c.json({
        type: 7,
        data: {
          embeds: [
            {
              title: fr ? 'Boutique' : 'Shop',
              description,
              image: {
                url: addImageVersion(`${BASE_URL}/shop/${page}?lang=${fr ? 'fr' : 'en'}`),
              },
              color: 0x2b2d31,
            },
          ],
          components,
        },
      });
    } catch (error) {
      console.error('[shop_select] error:', error);
      return c.json({ type: 6 });
    }
  }

  if (customId.startsWith('shop_buy:')) {
    try {
      const parts = customId.split(':');
      const itemKey = parts[1] || '';
      const pageRaw = parts[2] || '1';
      const requestUserId = parts[3] || '';
      if (requestUserId !== userID) {
        return c.json({ type: 6 });
      }

      const { getShopItem, buildShopComponents } = await import('../commands/shop.js');
      const shopItem = getShopItem(itemKey);
      if (!shopItem) {
        return c.json({
          type: 7,
          data: { content: fr ? 'Item invalide' : 'Invalid item' },
        });
      }

      const { getPlayerProfile, updatePlayerGold } = await import('../../services/playerService.js');
      const { addInventoryItem } = await import('../../services/inventoryService.js');
      const profile = await getPlayerProfile(userID);
      if (!profile) {
        return c.json({
          type: 7,
          data: { content: fr ? 'Profil indisponible' : 'Profile unavailable' },
        });
      }

      const cost = shopItem.price;
      if (profile.gold < cost) {
        return c.json({
          type: 7,
          data: { content: fr ? 'Or insuffisant' : 'Not enough gold' },
        });
      }

      const updatedGold = await updatePlayerGold(userID, -cost);
      await addInventoryItem(userID, shopItem.itemKey, shopItem.itemType, 1);

      const page = Math.max(1, Number(pageRaw) || 1);
      const { pageCount, pageItems } = await getPagedShopItems(page);
      const components = buildShopComponents(pageItems, page, pageCount, fr, userID);

      const message = fr ? `✅ Achat de ${shopItem.nameFr} réussi. Or restant : ${updatedGold}.` : `✅ Bought ${shopItem.nameEn}. Remaining gold: ${updatedGold}.`;

      return c.json({
        type: 7,
        data: {
          embeds: [
            {
              title: fr ? 'Achat réussi' : 'Purchase success',
              description: message,
              image: {
                url: addImageVersion(`${BASE_URL}/shop/${page}?lang=${fr ? 'fr' : 'en'}`),
              },
              color: 0x2b2d31,
            },
          ],
          components,
        },
      });
    } catch (error) {
      console.error('[shop_buy] error:', error);
      return c.json({ type: 6 });
    }
  }

  if (customId.startsWith('affinity_gift_apply:')) {
    const parts = customId.split(':');
    const itemKey = parts[1] || '';
    const characterKeyRaw = parts[2] || '';
    const requestUserId = parts[3] || '';

    if (!itemKey || requestUserId !== userID) {
      return c.json({ type: 6 });
    }

    if (!Object.values(CharacterKey).includes(characterKeyRaw as CharacterKey)) {
      return c.json({ type: 6 });
    }

    const characterKey = characterKeyRaw as CharacterKey;
    const donation = await donateAccessoryToCharacter(userID, itemKey, characterKey);

    if (!donation.success) {
      const message = donation.reason === 'out-of-stock' ? (fr ? 'Accessoire indisponible ou stock insuffisant.' : 'Accessory unavailable or insufficient stock.') : fr ? 'Accessoire invalide.' : 'Invalid accessory.';

      const { buildAffinityMessageData } = await import('../commands/affinity.js');
      const data = await buildAffinityMessageData(userID, userID, fr, message, undefined, false);

      return c.json({
        type: 7,
        data,
      });
    }

    const targetLabel = characterKey === CharacterKey.Darkness ? 'Darkness' : characterKey === CharacterKey.Megumin ? 'Megumin' : 'Aqua';

    const successMessage = fr ? `Don effectue sur ${targetLabel}: +${donation.affinityPoints} affinite.` : `Gift sent to ${targetLabel}: +${donation.affinityPoints} affinity.`;

    const { buildAffinityMessageData } = await import('../commands/affinity.js');
    const data = await buildAffinityMessageData(userID, userID, fr, successMessage, undefined, true);

    return c.json({
      type: 7,
      data,
    });
  }

  // Handle consumable item selection (step 1): choose which item to use
  if (customId.startsWith('consumable_item:')) {
    try {
      const parts = customId.split(':');
      const payload = parts[1] || '';
      const itemKey = parts[2] || '';
      const requestUserId = parts[3] || '';

      if (requestUserId !== userID) {
        return c.json({
          type: 6,
        });
      }

      const targets = [
        { id: 0, labelFr: 'Kazuma', labelEn: 'Kazuma' },
        { id: 1, labelFr: 'Aqua', labelEn: 'Aqua' },
        { id: 2, labelFr: 'Megumin', labelEn: 'Megumin' },
        { id: 3, labelFr: 'Darkness', labelEn: 'Darkness' },
      ];

      const { buildComponents } = await import('../../utils/componentsBuilder.js');
      const difficulty = extractDifficulty(payload) ?? undefined;
      const { alivePlayerIds } = await buildComponents(payload, userID, lang, false, difficulty);

      const components = [
        {
          type: 1,
          components: targets.map(target => ({
            type: 2,
            label: fr ? target.labelFr : target.labelEn,
            style: 1,
            custom_id: `consumable_apply:${payload}:${itemKey}:${target.id}:${userID}`,
            disabled: !alivePlayerIds.includes(target.id),
          })),
        },
        {
          type: 1,
          components: [
            {
              type: 2,
              label: fr ? 'Retour en jeu' : 'Back to game',
              style: 2,
              custom_id: `${payload}:${userID}`,
            },
          ],
        },
      ];

      return c.json({
        type: 7,
        data: {
          components,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[consumable_item] Interaction error:', message);
      return c.json({
        type: 6,
      });
    }
  }

  // Handle consumable application (step 2): apply item to selected target
  if (customId.startsWith('consumable_apply:')) {
    try {
      const parts = customId.split(':');
      const payload = parts[1] || '';
      const itemKey = parts[2] || '';
      const targetIdRaw = parts[3] || '0';
      const requestUserId = parts[4] || '';

      if (requestUserId !== userID) {
        return c.json({
          type: 6,
        });
      }

      const targetId = Number.parseInt(targetIdRaw, 10);
      const nextPayload = `${payload}u`;
      const { buildComponents, getBattleMonsterNames } = await import('../../utils/componentsBuilder.js');
      const difficulty = extractDifficulty(nextPayload) ?? undefined;
      const { buttons, embedDescription, gameState, creature } = await buildComponents(nextPayload, userID, lang, false, difficulty, itemKey, Number.isNaN(targetId) ? undefined : targetId);
      const actualMonsterNames = getBattleMonsterNames(creature, lang);
      const monsterName = actualMonsterNames.displayName;

      persistRunResultInBackground({
        userId: userID,
        payload: nextPayload,
        state: gameState,
        training: isTraining(nextPayload),
        monsterName: actualMonsterNames.recordName,
      });

      const { handleDefaultButton } = await import('./handleDefaultButton.js');
      return handleDefaultButton(c, nextPayload, userID, lang, fr, monsterName, embedDescription, buttons);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[consumable_apply] Interaction error:', message);
      return c.json({
        type: 6,
      });
    }
  }

  // Handle combat-related custom_ids (require payload decoding)
  const colonIdx = customId.lastIndexOf(':');
  const encodedPayload = colonIdx !== -1 ? customId.slice(0, colonIdx) : customId;
  const decodeResult = await decodeGameplayPayloadWithStatus(encodedPayload, userID);

  if (!decodeResult.payload) {
    const content = decodeResult.reason === 'stale' ? (fr ? 'Ce bouton est obsolete. Utilise le dernier message de combat.' : 'This button is outdated. Use the latest battle message.') : fr ? 'Session de combat invalide ou expirée. Utilise le dernier message de combat.' : 'Battle session is invalid or expired. Use the latest battle message.';

    return c.json({
      type: 4,
      data: {
        content,
        flags: 1 << 6,
      },
    });
  }

  const resolvedEncodedPayload = decodeResult.payload;

  // Check if this is a consumables menu action (ends with 'c')
  if (resolvedEncodedPayload.endsWith('c')) {
    try {
      const { handleConsumablesButton } = await import('./handleConsumablesButton.js');
      return await handleConsumablesButton(c, userID, fr, resolvedEncodedPayload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[consumables] Interaction error:', message);
      return c.json({
        type: 4,
        data: {
          content: fr ? "Erreur lors de l'ouverture du menu consommables. Réessayez." : 'Error opening consumables menu. Please try again.',
          flags: 1 << 6,
        },
      });
    }
  }

  const payload = decompressMoves(resolvedEncodedPayload);
  const owner = colonIdx !== -1 ? customId.slice(colonIdx + 1) : '';

  if (owner && owner !== userID && owner !== 'all') {
    return c.json({
      type: 4,
      data: {
        content: fr ? "Ce n'est pas votre partie !" : 'Not your game!',
        flags: 1 << 6,
      },
    });
  }

  console.log('Received button interaction with payload:', resolvedEncodedPayload);

  const { buildComponents, getBattleMonsterNames } = await import('../../utils/componentsBuilder.js');
  const training = isTraining(payload);
  const difficulty = extractDifficulty(payload) ?? undefined;
  const { buttons, embedDescription, activePlayerName, gameState, creature } = await buildComponents(payload, userID, lang, false, difficulty);
  const actualMonsterNames = getBattleMonsterNames(creature, lang);
  const monsterName = actualMonsterNames.displayName;

  persistRunResultInBackground({
    userId: userID,
    payload,
    state: gameState,
    training,
    monsterName: actualMonsterNames.recordName,
  });

  const special = resolvedEncodedPayload.endsWith('p');
  if (special) {
    const { handleSpecialButton } = await import('./handleSpecialButton.js');
    return handleSpecialButton(interaction, c, payload, userID, lang, fr, monsterName, activePlayerName, embedDescription, buttons);
  }

  const { handleDefaultButton } = await import('./handleDefaultButton.js');
  return handleDefaultButton(c, payload, userID, lang, fr, monsterName, embedDescription, buttons);
}
