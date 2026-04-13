import { type QuestConditionKey } from "../enums/QuestConditionKey";
import { type QuestKey } from "../enums/QuestKey";

export type QuestDefinition = {
  key: QuestKey;
  targetProgress: number;
  rewardGold: number;
  conditionKey: QuestConditionKey;
};
