import { Lang } from '../objects/enums/Lang';
import { Game } from '../objects/types/Game';

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
