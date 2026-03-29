export type DailyQuestStatus = {
  questKey: string;
  questDay: string;
  progress: number;
  target: number;
  claimed: boolean;
  rewardGold: number;
};
