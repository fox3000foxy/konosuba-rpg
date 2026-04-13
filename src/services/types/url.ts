import { type Random } from "../../classes/Random";

export type ParsedGameUrl = {
  rand: Random;
  moves: string[];
  seed: string;
  monster: string | null;
  difficulty: string | null;
};
