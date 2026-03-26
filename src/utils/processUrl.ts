import { Random } from '../classes/Random';
import { PlayerAction } from '../enums/player/PlayerAction';

export default function processUrl(url: string): [Random, string[], string, string | null] {
  const validMovesSet = new Set([
    PlayerAction.Atk.toLocaleUpperCase(),
    PlayerAction.Def.toLocaleUpperCase(),
    PlayerAction.Hug.toLocaleUpperCase(),
    PlayerAction.Hea.toLocaleUpperCase(),
    PlayerAction.Giv.toLocaleUpperCase()
  ]);

  let monster: string | null = null;
  if (url.includes('monster')) {
    const monsterParam = url.split('monster=')[1];
    monster = monsterParam ? monsterParam.split('&')[0] : null;
  }

  url = url.toLowerCase();
  const seedStr = url.split('?')[0].split('/')[5] || '';

  const moves = url
    .toUpperCase()
    .split('/')
    .filter((move) => validMovesSet.has(move));

  const seed = Array.from(seedStr).reduce((acc, char) => (acc + char.charCodeAt(0)) % 8096, 0);

  const rand = new Random(seed);
  return [rand, moves, seedStr, monster];
}
