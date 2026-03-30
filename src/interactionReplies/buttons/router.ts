import { Context } from 'hono';
import { Interaction } from '../../objects/enums/Interaction';
import { Lang } from '../../objects/enums/Lang';
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
import { handleMenuButton } from './handleMenuButton';
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
  const colonIdx = customId.lastIndexOf(':');
  const encodedPayload =
    colonIdx !== -1 ? customId.slice(0, colonIdx) : customId;
  const payload = decompressMoves(encodedPayload);
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

  console.log('Received button interaction with payload:', encodedPayload);

  if (encodedPayload.startsWith('menu.')) {
    try {
      return await handleMenuButton(c, encodedPayload, userID, lang, fr);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[menu] Interaction error:', message);
      return c.json({
        type: 4,
        data: {
          content: fr
            ? 'Erreur du menu. Reessayez dans quelques secondes.'
            : 'Menu error. Please try again in a few seconds.',
          flags: 1 << 6,
        },
      });
    }
  }

  if (encodedPayload === 'consumables') {
    return handleConsumablesButton(c, userID, fr);
  }

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

  const special = interaction.data.custom_id.split(':')[0].endsWith('p');
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
