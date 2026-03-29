import { Context } from 'hono';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';
import {
    claimDailyQuestReward,
    ensurePlayerProfile,
    getDailyQuestStatus,
} from '../../services/progressionService';

const QUEST_ACTION_VIEW = 'view';
const QUEST_ACTION_CLAIM = 'claim';

function resolveAction(options: InteractionDataOption[] | undefined): string {
  const action = options?.find(o => o.name === 'action')?.value;
  if (typeof action !== 'string') {
    return QUEST_ACTION_VIEW;
  }

  return action.toLowerCase() === QUEST_ACTION_CLAIM
    ? QUEST_ACTION_CLAIM
    : QUEST_ACTION_VIEW;
}

export async function handleQuestCommand(
  c: Context,
  userID: string,
  fr: boolean,
  options?: InteractionDataOption[]
) {
  await ensurePlayerProfile(userID);

  const action = resolveAction(options);
  let claimMessage = '';

  if (action === QUEST_ACTION_CLAIM) {
    const claimResult = await claimDailyQuestReward(userID);
    if (claimResult.status === 'claimed') {
      claimMessage = fr
        ? `\n\nRecompense recuperee: +${claimResult.rewardGold} or.`
        : `\n\nReward claimed: +${claimResult.rewardGold} gold.`;
    } else if (claimResult.status === 'already-claimed') {
      claimMessage = fr
        ? "\n\nRecompense deja recuperee aujourd'hui."
        : '\n\nReward already claimed today.';
    } else if (claimResult.status === 'not-completed') {
      claimMessage = fr
        ? '\n\nQuete non terminee, impossible de recuperer la recompense.'
        : '\n\nQuest not completed yet, reward cannot be claimed.';
    } else {
      claimMessage = fr
        ? '\n\nService de quete indisponible pour le moment.'
        : '\n\nQuest service is unavailable right now.';
    }
   }

  const questStatus = await getDailyQuestStatus(userID);
  if (!questStatus) {
    return c.json({
      type: 4,
      data: {
        content: fr
          ? 'Quetes indisponibles pour le moment.'
          : 'Quests are unavailable right now.',
        flags: 1 << 6,
      },
    });
  }

  const statusText = questStatus.claimed
    ? fr
      ? 'Terminee et recompense recuperee'
      : 'Completed and reward claimed'
    : questStatus.progress >= questStatus.target
      ? fr
        ? 'Terminee (recompense disponible)'
        : 'Completed (reward available)'
      : fr
        ? 'En cours'
        : 'In progress';

  const description = fr
    ? `# Quete du jour\n\n**Objectif**: Gagner 1 combat\n**Progression**: ${questStatus.progress}/${questStatus.target}\n**Recompense**: ${questStatus.rewardGold} or\n**Statut**: ${statusText}${claimMessage}\n\nUtilise \`/quest action:claim\` pour recuperer la recompense.`
    : `# Daily quest\n\n**Goal**: Win 1 battle\n**Progress**: ${questStatus.progress}/${questStatus.target}\n**Reward**: ${questStatus.rewardGold} gold\n**Status**: ${statusText}${claimMessage}\n\nUse \`/quest action:claim\` to claim the reward.`;

  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          description,
          color: 0x2b2d31,
        },
      ],
    },
  });
}
