import { Context } from "hono";
import { Creature } from "../../classes/Creature";
import { GenericCreature } from "../../classes/GenericCreature";
import { Random } from "../../classes/Random";
import { generateMob } from "../../objects/data/mobMap";
import { InteractionDataOption } from "../../objects/types/InteractionDataOption";
import { pascalCaseToString } from "../../utils/processGame";

function findMonster(monsterCandidate: string, fr: boolean) {
  const mobs = generateMob();
  const langIndex = fr ? 1 : 0;
  return mobs.find((m) => m.name[langIndex].toLowerCase() === monsterCandidate);
}

function buildInvalidMonsterResponse(fr: boolean, mobs = generateMob()) {
  const langIndex = fr ? 1 : 0;
  const allMobs = mobs
    .map(
      (m) =>
        `**${m.name[langIndex]}** (${m.constructor.name || pascalCaseToString(m.constructor.name)})`,
    )
    .sort();

  return {
    type: 4,
    data: {
      embeds: [
        {
          description: fr
            ? `Ce monstre est invalide. Voici les monstres valides: ${allMobs.join(", ")}`
            : `Invalid monster. Valid monsters: ${allMobs.join(", ")}`,
        },
      ],
    },
  };
}

export function generateMonsterInfos(
  monsterCandidate: string,
  fr: boolean,
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
  const monster = findMonster(monsterCandidate, fr);

  if (!monster) {
    return { command: buildInvalidMonsterResponse(fr, mobs), creature: null };
  }

  if (monster instanceof GenericCreature) {
    const rand = new Random();
    monster.pickColor(rand);
  }
  const imgUrl = `https://fox3000foxy.com/konosuba-rpg/assets/mobs/${monster.images[0]}.webp`;

  return {
    command: {
      type: 4,
      data: {
        embeds: [
          {
            description: fr
              ? `# Informations de monstre:\n\n**Nom**: ${monster.name[langIndex]}\n**PV**: ${monster.hp} PV\n**ATK**: ${monster.attack[0]}-${monster.attack[1]} points de dégâts.\n**LP**: ${monster.love !== 100 ? monster.love + " points d'amour" : "Ne peut pas être ami"}` +
                `\n\n${monster.lore}`
              : `# Monster infos:\n\n**Name**: ${monster.name[langIndex]}\n**HP**: ${monster.hp} HP\n**ATK**: ${monster.attack[0]}-${monster.attack[1]} damage points.\n**LP**: ${monster.love !== 100 ? monster.love + " love points" : "Can't be friends"}` +
                `\n\n${monster.lore}`,
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
  monsterConstructorName: string,
  fr: boolean,
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
  const normalizedConstructorName = monsterConstructorName.trim().toLowerCase();
  const monster = mobs.find(
    (m) => m.constructor.name.toLowerCase() === normalizedConstructorName,
  );

  if (!monster) {
    return { command: buildInvalidMonsterResponse(fr, mobs), creature: null };
  }

  return generateMonsterInfos(monster.name[langIndex].toLowerCase(), fr);
}

export async function handleInfosMonsterCommand(
  c: Context,
  fr: boolean,
  options: InteractionDataOption[],
) {
  const commandMonster = options.find((o) => o.name === "monster")?.value;
  const monsterCandidate =
    typeof commandMonster === "string"
      ? commandMonster.trim().toLowerCase()
      : "";

  return c.json(generateMonsterInfos(monsterCandidate, fr).command);
}
