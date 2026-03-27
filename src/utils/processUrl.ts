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
  // Extract monster parameter if present
  const monster = url.includes("monster")
    ? url.split("monster=")[1]?.split("&")[0] || null
    : null;

  // Convert URL to lowercase once and split it
  const lowerUrl = url.toLowerCase();
  const urlParts = lowerUrl.split("/");

  // Extract seed string from the URL parts
  const seedStr = urlParts[5] || "";

  // Filter valid moves from the URL parts
  const moves = urlParts
    .map((part) => part.toUpperCase())
    .filter((move) => VALID_MOVES_SET.has(move));

  // Compute seed using a single reduce operation
  const seed = Array.from(seedStr).reduce(
    (acc, char) => (acc + char.charCodeAt(0)) % 8096,
    0,
  );

  const rand = new Random(seed);
  return [rand, moves, seedStr, monster];
}
