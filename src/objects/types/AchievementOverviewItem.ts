import { type AchievementKey } from "../enums/AchievementKey";

export type AchievementOverviewItem = {
  key: AchievementKey;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
};
