import { Random } from './Random';

export default function processUrl(url: string): [Random, string[], string, string | null] {
  const valid_moves = ['ATK', 'DEF', 'HUG', 'GIV'];
  let monster: string | null = null;

  if (url.indexOf('monster') !== -1) {
    monster = url.split('monster=')[1];
  }

  url = url.toLowerCase();
  let seed = 0;
  let seed_str = url.split('?')[0].split('/')[3];

  let moves = url.toUpperCase().split('/');
  moves = moves.filter((m) => valid_moves.indexOf(m) !== -1);

  if (seed_str.includes('vieord') || seed_str.includes('vixord')) {
    seed_str = '';
  }

  for (let j = 0; j < seed_str.length; j++) {
    const c = seed_str.charAt(j);
    seed = (seed + c.charCodeAt(0)) % 8096;
  }

  const rand = new Random(seed);
  return [rand, moves, seed_str, monster];
}
