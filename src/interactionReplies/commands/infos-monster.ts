import { Context } from 'hono';
import { Creature } from '../../classes/Creature';
import { GenericCreature } from '../../classes/GenericCreature';
import { Random } from '../../classes/Random';
import { generateMob } from '../../objects/data/mobMap';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';

type MonsterCatalogItem = {
  id: string;
  name: string;
  creature: Creature;
};

function normalizeMonsterText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function normalizeMonsterIdentifier(value: string): string {
  return normalizeMonsterText(value).replace(/[^a-z0-9]/g, '');
}

function buildMonsterId(creature: Creature): string {
  return creature.constructor.name;
}

function parseMonsterId(candidate: string): number | null {
  if (!candidate.startsWith('m')) {
    return null;
  }

  const raw = Number(candidate.slice(1));
  return Number.isInteger(raw) && raw >= 0 ? raw : null;
}

function hashMonsterSeed(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function cloneCreature(monster: Creature): Creature {
  const clone = Object.create(Object.getPrototypeOf(monster));
  return Object.assign(clone, monster);
}

function prepareMonsterForInfos(monster: Creature): Creature {
  const preparedMonster = cloneCreature(monster);

  if (preparedMonster instanceof GenericCreature) {
    const stableSeed = hashMonsterSeed(preparedMonster.constructor.name);
    preparedMonster.pickColor(new Random(stableSeed));
  }

  return preparedMonster;
}

export function getMonsterCatalog(fr: boolean): MonsterCatalogItem[] {
  const langIndex = fr ? 1 : 0;
  const mobs = generateMob();

  return mobs
    .map(creature => ({
      id: buildMonsterId(creature),
      name: creature.name[langIndex],
      creature,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, fr ? 'fr' : 'en'));
}

function findMonster(monsterCandidate: string) {
  const mobs = generateMob();
  const normalizedCandidate = normalizeMonsterIdentifier(monsterCandidate);

  const idIndex = parseMonsterId(normalizedCandidate);
  if (idIndex !== null) {
    return mobs[idIndex] || null;
  }

  return mobs.find(m => normalizeMonsterIdentifier(m.constructor.name) === normalizedCandidate) || mobs.find(m => normalizeMonsterIdentifier(m.name[0]) === normalizedCandidate) || mobs.find(m => normalizeMonsterIdentifier(m.name[1]) === normalizedCandidate) || null;
}

function buildInvalidMonsterResponse(fr: boolean, mobs = generateMob()) {
  const langIndex = fr ? 1 : 0;
  const allMobs = Array.from(new Set(mobs.map(m => m.name[langIndex].trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, fr ? 'fr' : 'en'));

  return {
    type: 4,
    data: {
      embeds: [
        {
          description: fr ? `Ce monstre est invalide. Voici les monstres valides: ${allMobs.join(', ')}` : `Invalid monster. Valid monsters: ${allMobs.join(', ')}`,
        },
      ],
    },
  };
}

export function generateMonsterInfos(
  monsterCandidate: string,
  fr: boolean
): {
  command: {
    type: number;
    data: {
      embeds: {
        description: string;
        image?: { url: string };
        color?: number;
      }[];
    };
  };
  creature: Creature | null;
} {
  const mobs = generateMob();
  const langIndex = fr ? 1 : 0;
  const monster = findMonster(monsterCandidate);

  if (!monster) {
    return { command: buildInvalidMonsterResponse(fr, mobs), creature: null };
  }

  const preparedMonster = prepareMonsterForInfos(monster);
  const lore = fr ? preparedMonster.lore[0] : preparedMonster.lore[1];
  const imgUrl = `https://fox3000foxy.com/konosuba-rpg/assets/mobs/${preparedMonster.images[0]}.webp`;

  return {
    command: {
      type: 4,
      data: {
        embeds: [
          {
            description: fr ? `# Informations de monstre:\n\n**Nom**: ${preparedMonster.name[langIndex]}\n**PV de base**: ${preparedMonster.hp} PV\n**ATK de base**: ${preparedMonster.attack[0]}-${preparedMonster.attack[1]} points de dégâts.\n**LP**: ${preparedMonster.love !== 100 ? preparedMonster.love + " points d'amour" : 'Ne peut pas être ami'}` + `\n\n${lore}` : `# Monster infos:\n\n**Name**: ${preparedMonster.name[langIndex]}\n**Basic HP**: ${preparedMonster.hp} HP\n**Basic ATK**: ${preparedMonster.attack[0]}-${preparedMonster.attack[1]} damage points.\n**LP**: ${preparedMonster.love !== 100 ? preparedMonster.love + ' love points' : "Can't be friends"}` + `\n\n${lore}`,
            image: { url: imgUrl },
            color: 0x2b2d31,
          },
        ],
      },
    },
    creature: preparedMonster,
  };
}

export function generateMonsterInfosByConstructorName(
  monsterIdentifier: string,
  fr: boolean
): {
  command: {
    type: number;
    data: {
      embeds: {
        description: string;
        image?: { url: string };
        color?: number;
      }[];
    };
  };
  creature: Creature | null;
} {
  const monster = findMonster(monsterIdentifier);

  if (!monster) {
    return { command: buildInvalidMonsterResponse(fr), creature: null };
  }

  return generateMonsterInfos(monster.constructor.name, fr);
}

export async function handleInfosMonsterCommand(c: Context, fr: boolean, options: InteractionDataOption[]) {
  const commandMonster = options.find(o => o.name === 'monster')?.value;
  const monsterCandidate = typeof commandMonster === 'string' ? commandMonster.trim().toLowerCase() : '';

  return c.json(generateMonsterInfos(monsterCandidate, fr).command);
}
