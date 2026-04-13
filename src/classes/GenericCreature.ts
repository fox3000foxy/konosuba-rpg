import { Errors } from "../objects/enums/Errors";
import { Creature } from "./Creature";
import { type Random } from "./Random";

export type { GenericCreatureInterface } from "../objects/types/GenericCreatureInterface";

export abstract class GenericCreature extends Creature {
  constructor() {
    super();
    if (new.target === GenericCreature) {
      throw new Error(Errors.ABSTRACT_ERROR);
    }
  }

  abstract pickColor(rng: Random): void;
}
