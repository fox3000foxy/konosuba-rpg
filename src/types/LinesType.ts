import { Lang } from "../enums/Lang";

export type LinesType = {
  [key in Lang]: {
    youAttackMsgs: string[][];
    youDefendMsgs: string[][];
    youHugMsgs: string[][];
  };
};