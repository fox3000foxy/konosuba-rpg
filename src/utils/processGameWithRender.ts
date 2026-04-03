import { Random } from '../classes/Random';
import { ItemId } from '../objects/enums/ItemId';
import { Lang } from '../objects/enums/Lang';
import { MonsterDifficulty } from '../objects/enums/MonsterDifficulty';
import { Game } from '../objects/types/Game';
import processGame from './processGame';
import renderImage from './renderImage';

export default async function processGameWithRender(
  rand: Random,
  moves: string[],
  monsterName: string | null = null,
  lang: Lang = Lang.English,
  teamLevelFactors?: number[],
  difficulty?: string | MonsterDifficulty | null,
  userId?: string,
  itemIds?: ItemId[],
  selectedUseTargetPlayerId?: number
): Promise<Game> {
  const game = await processGame(rand, moves, monsterName, lang, false, teamLevelFactors, difficulty, userId, itemIds, selectedUseTargetPlayerId);
  const image = await renderImage(game.state, game.messages, game.team, game.creature, lang);

  return {
    ...game,
    image,
  };
}
