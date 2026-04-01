import { Random } from '../../classes/Random';
import { CreatureInterface } from './CreatureInterface';

export interface GenericCreatureInterface extends CreatureInterface {
  pickColor(rng: Random): void;
}
