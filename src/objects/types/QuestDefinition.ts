import { QuestConditionKey } from "../enums/QuestConditionKey";
import { QuestKey } from "../enums/QuestKey";

export type QuestDefinition = {
  key: QuestKey;
  targetProgress: number;
  rewardGold: number;
  conditionKey: QuestConditionKey;
};
