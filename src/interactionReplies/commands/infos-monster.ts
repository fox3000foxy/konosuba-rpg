import { Context } from 'hono';
import { Creature } from '../../classes/Creature';
import { GenericCreature } from '../../classes/GenericCreature';
import { Random } from '../../classes/Random';
import { generateMob } from '../../objects/data/mobMap';
import { EnglishLore } from '../../objects/enums/EnglishLore';
import { FrenchLores } from '../../objects/enums/FrenchLores';
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

function buildMonsterId(index: number): string {
  return `m${index}`;
}

function parseMonsterId(candidate: string): number | null {
  if (!candidate.startsWith('m')) {
    return null;
  }

  const raw = Number(candidate.slice(1));
  return Number.isInteger(raw) && raw >= 0 ? raw : null;
}

export function getMonsterCatalog(fr: boolean): MonsterCatalogItem[] {
  const langIndex = fr ? 1 : 0;
  const mobs = generateMob();

  return mobs
    .map((creature, index) => ({
      id: buildMonsterId(index),
      name: creature.name[langIndex],
      creature,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, fr ? 'fr' : 'en'));
}

function findMonster(monsterCandidate: string) {
  const mobs = generateMob();
  const normalizedCandidate = normalizeMonsterText(monsterCandidate);

  const idIndex = parseMonsterId(normalizedCandidate);
  if (idIndex !== null) {
    return mobs[idIndex] || null;
  }

  return (
    mobs.find(m => normalizeMonsterText(m.name[0]) === normalizedCandidate) ||
    mobs.find(m => normalizeMonsterText(m.name[1]) === normalizedCandidate) ||
    null
  );
}

function buildInvalidMonsterResponse(fr: boolean, mobs = generateMob()) {
  const langIndex = fr ? 1 : 0;
  const allMobs = Array.from(
    new Set(mobs.map(m => m.name[langIndex].trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, fr ? 'fr' : 'en'));

  return {
    type: 4,
    data: {
      embeds: [
        {
          description: fr
            ? `Ce monstre est invalide. Voici les monstres valides: ${allMobs.join(', ')}`
            : `Invalid monster. Valid monsters: ${allMobs.join(', ')}`,
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

  if (monster instanceof GenericCreature) {
    const rand = new Random();
    monster.pickColor(rand);
  }
  const monsterLoreKey = `Creature_${monster.constructor.name}` as keyof typeof FrenchLores;
  const lore = fr ? FrenchLores[monsterLoreKey] : EnglishLore[monsterLoreKey];
  const imgUrl = `https://fox3000foxy.com/konosuba-rpg/assets/mobs/${monster.images[0]}.webp`;

  return {
    command: {
      type: 4,
      data: {
        embeds: [
          {
            description: fr
              ? `# Informations de monstre:\n\n**Nom**: ${monster.name[langIndex]}\n**PV**: ${monster.hp} PV\n**ATK**: ${monster.attack[0]}-${monster.attack[1]} points de dégâts.\n**LP**: ${monster.love !== 100 ? monster.love + " points d'amour" : 'Ne peut pas être ami'}` +
                `\n\n${lore}`
              : `# Monster infos:\n\n**Name**: ${monster.name[langIndex]}\n**HP**: ${monster.hp} HP\n**ATK**: ${monster.attack[0]}-${monster.attack[1]} damage points.\n**LP**: ${monster.love !== 100 ? monster.love + ' love points' : "Can't be friends"}` +
                `\n\n${lore}`,
            image: { url: imgUrl },
            color: 0x2b2d31,
          },
        ],
      },
    },
    creature: monster,
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
  const mobs = generateMob();
  const monster = findMonster(monsterIdentifier);

  if (!monster) {
    return { command: buildInvalidMonsterResponse(fr, mobs), creature: null };
  }

  return generateMonsterInfos(monster.name[fr ? 1 : 0], fr);
}

export async function handleInfosMonsterCommand(
  c: Context,
  fr: boolean,
  options: InteractionDataOption[]
) {
  const commandMonster = options.find(o => o.name === 'monster')?.value;
  const monsterCandidate =
    typeof commandMonster === 'string'
      ? commandMonster.trim().toLowerCase()
      : '';

  return c.json(generateMonsterInfos(monsterCandidate, fr).command);
}
