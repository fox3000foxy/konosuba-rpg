import { PlayerAction } from '../classes/Player';
import { Random } from '../classes/Random';

export default function processUrl(url: string): [Random, string[], string, string | null] {
  const valid_moves = [
    PlayerAction.Atk.toLocaleUpperCase(),
    PlayerAction.Def.toLocaleUpperCase(),
    PlayerAction.Hug.toLocaleUpperCase(),
    PlayerAction.Giv.toLocaleUpperCase()
  ];
  let monster: string | null = null;

  if (url.indexOf('monster') !== -1) {
    monster = url.split('monster=')[1];
  }

  url = url.toLowerCase();
  let seed = 0;
  const seed_str = url.split('?')[0].split('/')[5];
  // console.log(url, seed_str)

  let moves = url.toUpperCase().split('/');
  moves = moves.filter((m) => valid_moves.indexOf(m) !== -1);

  for (let j = 0; j < seed_str.length; j++) {
    const c = seed_str.charAt(j);
    seed = (seed + c.charCodeAt(0)) % 8096;
  }

  const rand = new Random(seed);
  return [rand, moves, seed_str, monster];
}
