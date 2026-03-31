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

      const difficulty = extractDifficulty(payload) ?? undefined;
      const { alivePlayerIds } = await buildComponents(
        payload,
        userID,
        lang,
        false,
        difficulty
      );

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
      const difficulty = extractDifficulty(nextPayload) ?? undefined;
      const cleanPayload = removeDifficultyFromPayload(nextPayload);
      const inferredMonsterName = inferMonsterFromPayload(cleanPayload);
      const monsterName = inferredMonsterName || '';

      const { buttons, embedDescription, gameState } =
        await buildComponents(
          nextPayload,
          userID,
          lang,
          false,
          difficulty,
          itemKey,
          Number.isNaN(targetId) ? undefined : targetId
        );

      void recordRunResult({
        userId: userID,
        payload: nextPayload,
        state: gameState,
        training: isTraining(nextPayload),
        monsterName: inferredMonsterName,
      });

      return handleDefaultButton(
        c,
        nextPayload,
        userID,
        lang,
        fr,
        monsterName,
        embedDescription,
        buttons
      );
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
