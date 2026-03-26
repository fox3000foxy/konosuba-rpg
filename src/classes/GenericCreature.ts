import { Errors } from "../enums/Errors";
import { Creature, CreatureInterface } from "./Creature";
import { Random } from "./Random";

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pickColor(rng: Random) {
        throw new Error(Errors.ABSTRACT_METHOD_ERROR);
    }
}