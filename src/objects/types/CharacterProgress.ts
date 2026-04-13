import type { CharacterKey } from "../enums/CharacterKey";

export type CharacterProgress = {
  userId: string;
  characterKey: CharacterKey;
  xp: number;
  level: number;
  affinity: number;
};
