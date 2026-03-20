import Random from './Random';

export default function processUrl(url: string): [Random, string[], string, string | null] {
  const valid_moves = ['ATK', 'DEF', 'HUG', 'GIV'];
  let monster: string | null = null;

  if (url.indexOf('monster') !== -1) {
    monster = url.split('monster=')[1];
  }

  url = url.toLowerCase();
  let seed = 0;
  const seed_str = url.split('?')[0].split('/')[3];

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
  rand.choice = (array: any[]) => {
    return array[Math.floor(rand() * array.length)];
  };

  rand.randint = (min: number, max: number) => {
    return Math.floor(rand() * (max - min)) + min;
  };

  rand.integer = (integer1: number, integer2: number) => {
    const array = [integer1, integer2];
    return array[Math.floor(rand() * array.length)];
  };

  return [rand, moves, seed_str, monster];
}
