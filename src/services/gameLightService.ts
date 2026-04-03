import { Lang } from '../objects/enums/Lang';
import { Game } from '../objects/types/Game';
import processGame from '../utils/processGame';
import { parseGameUrl } from './urlService';

export async function calculateGameStateFromUrlLight(url: string, lang: Lang, userID?: string): Promise<Game> {
  const { rand, moves, monster, difficulty } = parseGameUrl(url);
  return processGame(rand, moves, monster, lang, undefined, difficulty, userID);
}
