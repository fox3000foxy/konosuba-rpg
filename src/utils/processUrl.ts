import { Random } from "../classes/Random";
import { PlayerAction } from "../enums/player/PlayerAction";

// Precompute valid moves set outside the function to avoid recreating it on every call
const VALID_MOVES_SET = new Set([
  PlayerAction.Atk.toLocaleUpperCase(),
  PlayerAction.Def.toLocaleUpperCase(),
  PlayerAction.Hug.toLocaleUpperCase(),
  PlayerAction.Hea.toLocaleUpperCase(),
  PlayerAction.Giv.toLocaleUpperCase(),
  PlayerAction.Spe.toLocaleUpperCase(),
]);

export default function processUrl(
  url: string,
): [Random, string[], string, string | null] {
  const monsterIdx = url.indexOf("monster=");
  let monster: string | null = null;
  if (monsterIdx !== -1) {
    const raw = url.slice(monsterIdx + 8);
    const ampIdx = raw.indexOf("&");
    monster = ampIdx === -1 ? raw || null : raw.slice(0, ampIdx) || null;
  }

  const urlParts = url.split("/");
  const seedStr = (urlParts[5] || "").toLowerCase();

  const moves: string[] = [];
  for (let i = 0; i < urlParts.length; i += 1) {
    const move = urlParts[i].toUpperCase();
    if (VALID_MOVES_SET.has(move)) {
      moves.push(move);
    }
  }

  let seed = 0;
  for (let i = 0; i < seedStr.length; i += 1) {
    seed = (seed + seedStr.charCodeAt(i)) % 8096;
  }

  const rand = new Random(seed);
  return [rand, moves, seedStr, monster];
}
