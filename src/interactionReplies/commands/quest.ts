import { Context } from 'hono';
import { BASE_URL } from '../../objects/config';
import { QuestAction } from '../../objects/enums/QuestAction';
import { QuestClaimStatus } from '../../objects/enums/QuestClaimStatus';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';
import { claimDailyQuestReward, ensurePlayerProfile, getQuestLabel, QUESTS } from '../../services/progressionService';
import { addImageVersion } from '../../utils/imageUtils';

const QUEST_ACTION_VIEW = QuestAction.View;
const QUEST_ACTION_CLAIM = QuestAction.Claim;

function resolveAction(options: InteractionDataOption[] | undefined): string {
  const action = options?.find(o => o.name === 'action')?.value;
  if (typeof action !== 'string') {
    return QUEST_ACTION_VIEW;
  }

  return action.toLowerCase() === QuestAction.Claim ? QUEST_ACTION_CLAIM : QUEST_ACTION_VIEW;
}

function resolveQuestId(options: InteractionDataOption[] | undefined): string {
  const questId = options?.find(o => o.name === 'quest_id')?.value;
  if (typeof questId === 'string') {
    return questId;
  }

  return QUESTS[0].key;
}

export async function handleQuestCommand(c: Context, userID: string, fr: boolean, options?: InteractionDataOption[]) {
  await ensurePlayerProfile(userID);

  const action = resolveAction(options);
  const questId = resolveQuestId(options);

  let claimMessage = '';

  if (action === QUEST_ACTION_CLAIM) {
    const claimResult = await claimDailyQuestReward(userID, questId);
    if (claimResult.status === QuestClaimStatus.Claimed) {
      claimMessage = fr ? `✅ Recompense recuperee: +${claimResult.rewardGold} or.` : `✅ Reward claimed: +${claimResult.rewardGold} gold.`;
    } else if (claimResult.status === QuestClaimStatus.AlreadyClaimed) {
      claimMessage = fr ? "⚠️ Recompense deja recuperee aujourd'hui." : '⚠️ Reward already claimed today.';
    } else if (claimResult.status === QuestClaimStatus.NotCompleted) {
      claimMessage = fr ? '❌ Quete non terminee, impossible de recuperer la recompense.' : '❌ Quest not completed yet, reward cannot be claimed.';
    } else {
      claimMessage = fr ? '❌ Service de quete indisponible pour le moment.' : '❌ Quest service is unavailable right now.';
    }
  }

  const imageUrl = addImageVersion(`${BASE_URL}/quest/${userID}?lang=${fr ? 'fr' : 'en'}`);

  const selectedQuestLabel = getQuestLabel(questId, fr);
  const claimInfo = action === QUEST_ACTION_CLAIM && claimMessage ? `\n\n${claimMessage}\n${fr ? 'Quete: ' : 'Quest: '}${selectedQuestLabel}` : '';

  const description = fr ? `# Quetes du Jour${claimInfo}\n\nUtilise \`/quest action:claim\` et sélectionne la quête pour recuperer la recompense.` : `# Daily Quests${claimInfo}\n\nUse \`/quest action:claim\` and select the quest to claim the reward.`;

  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          description,
          image: { url: imageUrl },
          color: 0x2b2d31,
        },
      ],
    },
  });
}
