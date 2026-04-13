import { Random } from "../classes/Random";
import { PlayerAction } from "../objects/enums/player/PlayerAction";

// Precompute valid moves set outside the function to avoid recreating it on every call
const VALID_MOVES_SET = new Set([PlayerAction.Atk.toUpperCase(), PlayerAction.Def.toUpperCase(), PlayerAction.Hug.toUpperCase(), PlayerAction.Hea.toUpperCase(), PlayerAction.Giv.toUpperCase(), PlayerAction.Spe.toUpperCase(), PlayerAction.Use.toUpperCase()]);

export default function processUrl(url: string): [Random, string[], string, string | null, string | null] {
  const monsterIdx = url.indexOf("monster=");
  let monster: string | null = null;
  if (monsterIdx !== -1) {
    const raw = url.slice(monsterIdx + 8);
    const ampIdx = raw.indexOf("&");
    monster = ampIdx === -1 ? raw || null : raw.slice(0, ampIdx) || null;
  }

  const difficultyIdx = url.indexOf("difficulty=");
  let difficulty: string | null = null;
  if (difficultyIdx !== -1) {
    const raw = url.slice(difficultyIdx + 11);
    const ampIdx = raw.indexOf("&");
    difficulty = ampIdx === -1 ? raw || null : raw.slice(0, ampIdx) || null;
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
  return [rand, moves, seedStr, monster, difficulty];
}
