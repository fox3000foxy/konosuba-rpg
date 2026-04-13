import type { QuestClaimStatus } from "../enums/QuestClaimStatus";

export type ClaimDailyQuestResult = {
  status: QuestClaimStatus;
  rewardGold: number;
};
