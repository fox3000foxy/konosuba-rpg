import { Context } from 'hono';
import { Interaction } from '../../objects/enums/Interaction';
import { Lang } from '../../objects/enums/Lang';
import { decodeGameplayPayloadWithStatus } from '../../services/gameSessionService';
import { recordRunResult } from '../../services/progressionService';
import { buildComponents } from '../../utils/componentsBuilder';
import { decompressMoves } from '../../utils/movesUtils';
import {
  extractDifficulty,
  isTraining,
  removeDifficultyFromPayload,
} from '../../utils/payloadUtils';
import { inferMonsterFromPayload } from '../../utils/runMonsterUtils';
import { handleConsumablesButton } from './handleConsumablesButton';
import { handleDefaultButton } from './handleDefaultButton';
import { handleSpecialButton } from './handleSpecialButton';

export async function handleButtonInteraction(
  c: Context,
  interaction: Interaction,
  userID: string,
  lang: Lang,
  fr: boolean
) {
  if (!interaction.data?.custom_id) {
    return c.json({ error: 'Unknown interaction' }, 400);
  }

  const customId: string = interaction.data.custom_id;

  // Handle consumable selection from useitem menu
  if (customId.startsWith('consumable_use:')) {
    try {
      const parts = customId.split(':');
      const itemId = parts[1];
      const requestUserId = parts[2];

      if (requestUserId !== userID) {
        return c.json({
          type: 4,
          data: {
            content: fr ? "Ce n'est pas votre partie !" : 'Not your game!',
            flags: 1 << 6,
          },
        });
      }

      // Return ephemeral message confirming selection
      return c.json({
        type: 4,
        data: {
          content: fr
            ? `Consommable sélectionné: ${itemId}\n\nCliquez sur le bouton USE Item pendant un combat pour utiliser cet item.`
            : `Consumable selected: ${itemId}\n\nClick the USE Item button during combat to use this item.`,
          flags: 1 << 6,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[consumable_use] Interaction error:', message);
      return c.json({
        type: 4,
        data: {
          content: fr
            ? 'Erreur lors de la sélection du consommable. Réessayez.'
            : 'Error selecting consumable. Please try again.',
          flags: 1 << 6,
        },
      });
    }
  }

  // Handle combat-related custom_ids (require payload decoding)
  const colonIdx = customId.lastIndexOf(':');
  const encodedPayload =
    colonIdx !== -1 ? customId.slice(0, colonIdx) : customId;
  const decodeResult = await decodeGameplayPayloadWithStatus(
    encodedPayload,
    userID
  );

  if (!decodeResult.payload) {
    const content =
      decodeResult.reason === 'stale'
        ? fr
          ? 'Ce bouton est obsolete. Utilise le dernier message de combat.'
          : 'This button is outdated. Use the latest battle message.'
        : fr
          ? 'Session de combat invalide ou expirée. Utilise le dernier message de combat.'
          : 'Battle session is invalid or expired. Use the latest battle message.';

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
      return await handleConsumablesButton(c, userID, fr, resolvedEncodedPayload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[consumables] Interaction error:', message);
      return c.json({
        type: 4,
        data: {
          content: fr
            ? 'Erreur lors de l\'ouverture du menu consommables. Réessayez.'
            : 'Error opening consumables menu. Please try again.',
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

  console.log(
    'Received button interaction with payload:',
    resolvedEncodedPayload
  );

  const training = isTraining(payload);
  const difficulty = extractDifficulty(payload) ?? undefined;
  const cleanPayload = removeDifficultyFromPayload(payload);
  const inferredMonsterName = inferMonsterFromPayload(cleanPayload);
  const monsterName = inferredMonsterName || '';
  const { buttons, embedDescription, activePlayerName, gameState } =
    await buildComponents(payload, userID, lang, false, difficulty);

  void recordRunResult({
    userId: userID,
    payload,
    state: gameState,
    training,
    monsterName: inferredMonsterName,
  });

  const special = resolvedEncodedPayload.endsWith('p');
  if (special) {
    return handleSpecialButton(
      interaction,
      c,
      payload,
      userID,
      lang,
      fr,
      monsterName,
      activePlayerName,
      embedDescription,
      buttons
    );
  }

  return handleDefaultButton(
    c,
    payload,
    userID,
    lang,
    fr,
    monsterName,
    embedDescription,
    buttons
  );
}
