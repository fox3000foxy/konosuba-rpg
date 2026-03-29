import { Errors } from '../enums/Errors';
import { Creature, CreatureInterface } from './Creature';
import { Random } from './Random';

export interface GenericCreatureInterface extends CreatureInterface {
  pickColor(rng: Random): void;
}

export abstract class GenericCreature extends Creature {
  constructor() {
    super();
    if (new.target === GenericCreature) {
      throw new Error(Errors.ABSTRACT_ERROR);
    }
  }

  abstract pickColor(rng: Random): void;
}
