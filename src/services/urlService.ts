import processUrl from "../utils/processUrl";
import type { ParsedGameUrl } from "./types/url";

export function parseGameUrl(url: string): ParsedGameUrl {
  const [rand, moves, seed, monster, difficulty] = processUrl(url);
  return { rand, moves, seed, monster, difficulty };
}
