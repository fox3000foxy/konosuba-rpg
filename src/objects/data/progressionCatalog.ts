import { AchievementKey } from '../enums/AchievementKey';
import { QuestConditionKey } from '../enums/QuestConditionKey';
import { QuestKey } from '../enums/QuestKey';
import { AchievementDefinition } from '../types/AchievementDefinition';
import { QuestDefinition } from '../types/QuestDefinition';

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    key: QuestKey.Win1Run,
    targetProgress: 1,
    rewardGold: 50,
    conditionKey: QuestConditionKey.Win,
  },
  {
    key: QuestKey.Play3Runs,
    targetProgress: 3,
    rewardGold: 30,
    conditionKey: QuestConditionKey.Play,
  },
  {
    key: QuestKey.LevelUpOnce,
    targetProgress: 1,
    rewardGold: 75,
    conditionKey: QuestConditionKey.LevelUp,
  },
];

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    key: AchievementKey.FirstWin,
    titleFr: 'Premiere victoire',
    titleEn: 'First victory',
    descriptionFr: 'Gagner 1 combat',
    descriptionEn: 'Win 1 battle',
  },
  {
    key: AchievementKey.TenWins,
    titleFr: 'Chasseur confirme',
    titleEn: 'Seasoned hunter',
    descriptionFr: 'Gagner 10 combats',
    descriptionEn: 'Win 10 battles',
  },
  {
    key: AchievementKey.Xp100,
    titleFr: 'Aventurier niveau 2',
    titleEn: 'Adventurer level 2',
    descriptionFr: 'Atteindre 100 XP',
    descriptionEn: 'Reach 100 XP',
  },
  {
    key: AchievementKey.Gold250,
    titleFr: 'Bourse pleine',
    titleEn: 'Heavy purse',
    descriptionFr: 'Atteindre 250 or',
    descriptionEn: 'Reach 250 gold',
  },
];