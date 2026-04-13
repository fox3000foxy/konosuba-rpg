import { type Gender } from "../enums/Gender";

export interface CreatureInterface {
  hpMax: number;
  hp: number;
  attack: number[];
  love: number;
  name: string[];
  images: string[];
  color?: string;
  prefix: boolean;
  lore: string[];
  gender: Gender;
}
