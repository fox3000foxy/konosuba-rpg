import { Creature } from '../../classes/Creature';
import { Team } from '../../classes/Player';
import { GameState } from '../../objects/enums/GameState';

export type Game = {
  image?: Uint8Array;
  state: GameState;
  messages: string[];
  embedDescription: string[];
  team: Team;
  creature: Creature;
  training: boolean;
};
