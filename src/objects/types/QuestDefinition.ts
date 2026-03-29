export type QuestDefinition = {
  key: string;
  targetProgress: number;
  rewardGold: number;
  conditionKey: 'win' | 'play' | 'level-up';
};
