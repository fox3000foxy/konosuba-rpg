
import { Creature } from '../classes/mobs/Creature';
import Troll from '../classes/mobs/Troll';
import Player from '../classes/Player';
import { mobMap } from './mobMap';
import { Random } from './Random';


const creatureClasses: typeof Creature[] = [];


function makeid(length: number): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZbcefgijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

function pascalCaseToString(pascalCaseWord: string): string {
  const regex = /([a-z])([A-Z])/g;
  const stringWithSpaces = pascalCaseWord.replace(regex, '$1 $2');
  return stringWithSpaces.charAt(0).toUpperCase() + stringWithSpaces.slice(1);
}

export default async function progressGame(
  rand: Random,
  moves: string[],
  seed_str: string,
  monster: string | null = null,
  lang: string = 'en'
): Promise<any> {
  lang = lang === 'fr' ? 'fr' : 'en';
  const player = new Player(rand);
  let creature: Creature | null = null;

  if (monster) {
    const MonsterClass = mobMap[monster] || Troll;
    creature = new MonsterClass(rand);
  } else {
    creature = new (rand.choice(creatureClasses))(rand);
  }

  if (lang !== 'fr') {
    creature.name = pascalCaseToString(monster || creature.constructor.name);
  }

  const messages = [
    lang === 'fr'
      ? `Attention, ${creature.prefix ? 'un ' : ''}${creature.name} !`
      : `Watch out, ${creature.prefix ? 'a ' : ''}${creature.name} !`,
  ];

  // Additional game logic here

  return { player, creature, messages };
}

