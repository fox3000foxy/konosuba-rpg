import { Context } from 'hono';
import { QuestAction } from '../../objects/enums/QuestAction';
import { QuestClaimStatus } from '../../objects/enums/QuestClaimStatus';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';
import {
  claimDailyQuestReward,
  ensurePlayerProfile,
  getAllQuestStatuses,
  getQuestLabel,
  QUESTS,
} from '../../services/progressionService';

const QUEST_ACTION_VIEW = QuestAction.View;
const QUEST_ACTION_CLAIM = QuestAction.Claim;

function resolveAction(options: InteractionDataOption[] | undefined): string {
  const action = options?.find(o => o.name === 'action')?.value;
  if (typeof action !== 'string') {
    return QUEST_ACTION_VIEW;
  }

  return action.toLowerCase() === QuestAction.Claim
    ? QUEST_ACTION_CLAIM
    : QUEST_ACTION_VIEW;
}

function resolveQuestId(options: InteractionDataOption[] | undefined): string {
  const questId = options?.find(o => o.name === 'quest_id')?.value;
  if (typeof questId === 'string') {
    return questId;
  }

  return QUESTS[0].key;
}

export async function handleQuestCommand(
  c: Context,
  userID: string,
  fr: boolean,
  options?: InteractionDataOption[]
) {
  await ensurePlayerProfile(userID);

  const action = resolveAction(options);
  const questId = resolveQuestId(options);

  let claimMessage = '';

  if (action === QUEST_ACTION_CLAIM) {
    const claimResult = await claimDailyQuestReward(userID, questId);
    if (claimResult.status === QuestClaimStatus.Claimed) {
      claimMessage = fr
        ? `\n\n✅ Recompense recuperee: +${claimResult.rewardGold} or.`
        : `\n\n✅ Reward claimed: +${claimResult.rewardGold} gold.`;
    } else if (claimResult.status === QuestClaimStatus.AlreadyClaimed) {
      claimMessage = fr
        ? "\n\n⚠️ Recompense deja recuperee aujourd'hui."
        : '\n\n⚠️ Reward already claimed today.';
    } else if (claimResult.status === QuestClaimStatus.NotCompleted) {
      claimMessage = fr
        ? '\n\n❌ Quete non terminee, impossible de recuperer la recompense.'
        : '\n\n❌ Quest not completed yet, reward cannot be claimed.';
    } else {
      claimMessage = fr
        ? '\n\n❌ Service de quete indisponible pour le moment.'
        : '\n\n❌ Quest service is unavailable right now.';
    }
  }

  const allStatuses = await getAllQuestStatuses(userID);

  const questTexts = allStatuses
    .map(status => {
      const statusEmoji = status.claimed
        ? '✅'
        : status.progress >= status.target
          ? '🎯'
          : '⏳';

      const progressBar =
        status.progress >= status.target
          ? `${'█'.repeat(status.target)} — Terminée`
          : `${'█'.repeat(Math.max(0, status.progress))}${'░'.repeat(Math.max(0, status.target - status.progress))} [${status.progress}/${status.target}]`;

      const questName = getQuestLabel(status.questKey, fr);

      const claimNotice =
        action === QUEST_ACTION_CLAIM && status.questKey === questId
          ? claimMessage
          : '';

      return `${statusEmoji} **${questName}** ${progressBar}\n💰 ${status.rewardGold} or${claimNotice}`;
    })
    .join('\n\n');

  const description = fr
    ? `# Quetes du Jour\n\n${questTexts}\n\nUtilise \`/quest action:claim\` et sélectionne la quête pour recuperer la recompense.`
    : `# Daily Quests\n\n${questTexts}\n\nUse \`/quest action:claim\` and select the quest to claim the reward.`;

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
