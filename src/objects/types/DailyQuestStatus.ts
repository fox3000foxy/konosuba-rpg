import { type QuestKey } from "../enums/QuestKey";

export type DailyQuestStatus = {
  questKey: QuestKey | string;
  questDay: string;
  progress: number;
  target: number;
  claimed: boolean;
  rewardGold: number;
};
