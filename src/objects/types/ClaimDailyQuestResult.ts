export type ClaimDailyQuestResult = {
  status: 'claimed' | 'already-claimed' | 'not-completed' | 'unavailable';
  rewardGold: number;
};
