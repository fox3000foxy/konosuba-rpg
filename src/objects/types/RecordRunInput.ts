import { GameState } from "../enums/GameState";

export type RecordRunInput = {
  userId: string;
  payload: string;
  state: GameState;
  training: boolean;
  monsterName: string | null;
};
