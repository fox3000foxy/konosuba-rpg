import { Random } from '../classes/Random';
import processUrl from '../utils/processUrl';

export type ParsedGameUrl = {
  rand: Random;
  moves: string[];
  seed: string;
  monster: string | null;
  difficulty: string | null;
};

export function parseGameUrl(url: string): ParsedGameUrl {
  const [rand, moves, seed, monster, difficulty] = processUrl(url);
  return { rand, moves, seed, monster, difficulty };
}
