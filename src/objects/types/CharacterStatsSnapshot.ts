import { CharacterKey } from '../enums/CharacterKey';

export type CharacterStatsSnapshot = {
  characterKey: CharacterKey | 'kazuma';
  level: number;
  factor: number;
};
