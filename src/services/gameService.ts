import { Lang } from '../objects/enums/Lang';
import { Game } from '../objects/types/Game';
import processGame from '../utils/processGame';
import { parseGameUrl } from './urlService';

import { getCharacterStatsSnapshot } from './progressionService';

async function getCharacterFactors(userID?: string): Promise<number[] | undefined> {
  if (!userID) {
    return undefined;
  }

  const characterStatsSnapshot = await getCharacterStatsSnapshot(userID);
  if (!characterStatsSnapshot) {
    return undefined;
  }

  return characterStatsSnapshot.map(snapshot => snapshot.factor);
}

export async function calculateGameStateFromUrl(url: string, lang: Lang, userID?: string): Promise<Game> {
  const { rand, moves, monster, difficulty } = parseGameUrl(url);
  const characterFactors = await getCharacterFactors(userID);
  return processGame(rand, moves, monster, lang, false, characterFactors, difficulty, userID);
}

export async function calculateGameImageFromUrl(url: string, lang: Lang, userID?: string): Promise<Game> {
  const { rand, moves, monster, difficulty } = parseGameUrl(url);
  const characterFactors = await getCharacterFactors(userID);

  return processGame(rand, moves, monster, lang, true, characterFactors, difficulty, userID);
}

export function serializeGameForApi(game: Game, lang: Lang): Record<string, unknown> {
  const serializableTeam = {
    ...game.team,
    players: game.team.players.map(player => {
      const playerWithoutTeam = { ...player } as Record<string, unknown>;
      delete playerWithoutTeam.team;
      delete playerWithoutTeam.images;
      delete playerWithoutTeam.specialAttackReady;
      delete playerWithoutTeam.specialAttackCurrentRounds;
      delete playerWithoutTeam.icon;
      delete playerWithoutTeam.lore;
      playerWithoutTeam.name = player.name[lang === Lang.French ? 0 : 1];
      return playerWithoutTeam;
    }),
  } as Record<string, unknown>;

  if (game.team.activePlayer) {
    serializableTeam.activePlayer = game.team.activePlayer.name[lang === Lang.French ? 0 : 1];
  }

  const strippedCreature = { ...game.creature } as Record<string, unknown>;
  delete strippedCreature.images;
  delete strippedCreature.lore;
  delete strippedCreature.prefix;
  strippedCreature.name = game.creature.name[lang === Lang.French ? 1 : 0] || game.creature.constructor.name;

  const serializableGame = {
    ...game,
    team: serializableTeam,
    creature: strippedCreature,
    training: undefined,
  };

  delete serializableGame.training;
  return serializableGame;
}
