import { MessagesTemplates } from "../classes/Creature";
import { Lang } from "../enums/Lang";

export type LinesType = {
  [key in Lang]: {
    youAttackMsgs: MessagesTemplates[][];
    youDefendMsgs: MessagesTemplates[][];
    youHugMsgs: MessagesTemplates[][];
  };
};