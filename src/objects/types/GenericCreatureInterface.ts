import { type Random } from "../../classes/Random";
import { type CreatureInterface } from "./CreatureInterface";

export interface GenericCreatureInterface extends CreatureInterface {
  pickColor(rng: Random): void;
}
