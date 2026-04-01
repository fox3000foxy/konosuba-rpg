import { Lang } from '../enums/Lang';
import { MessagesTemplates } from '../enums/MessagesTemplates';

export type LinesType = {
  [key in Lang]: {
    youAttackMsgs: MessagesTemplates[][];
    youDefendMsgs: MessagesTemplates[][];
    youHugMsgs: MessagesTemplates[][];
    aquaHealMsgs: MessagesTemplates[];
    youSpecialAttackMsgs: MessagesTemplates[][];
  };
};
