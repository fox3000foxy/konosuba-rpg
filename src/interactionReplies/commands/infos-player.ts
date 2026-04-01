import { Context } from 'hono';
import { Aqua, Darkness, Megumin, Player, Team } from '../../classes/Player';
import { Lang } from '../../objects/enums/Lang';

function getPlayerById(team: Team, characterId: number) {
  switch (characterId) {
    case 0:
      return team.players[0];
    case 1:
      return team.players[1] as Darkness;
    case 2:
      return team.players[2] as Megumin;
    case 3:
      return team.players[3] as Aqua;
    default:
      return null;
  }
}

export function generatePlayerInfos(
  fr: boolean,
  characterId: number
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
  player: Omit<Player, 'team'> | null;
} {
  if (!Number.isInteger(characterId) || characterId < 0 || characterId > 3) {
    return {
      command: {
        type: 4,
        data: {
          embeds: [
            {
              description: fr
                ? 'Personnage invalide. Choisissez 0-3 (Kazuma, Darkness, Megumin, Aqua).'
                : 'Invalid character. Choose 0-3 (Kazuma, Darkness, Megumin, Aqua).',
            },
          ],
        },
      },
      player: null,
    };
  }

  const team = new Team();
  const player = getPlayerById(team, characterId);
  if (!player) {
    return {
      command: {
        type: 4,
        data: {
          embeds: [
            {
              description: fr
                ? 'Personnage invalide. Choisissez 0-3 (Kazuma, Darkness, Megumin, Aqua).'
                : 'Invalid character. Choose 0-3 (Kazuma, Darkness, Megumin, Aqua).',
            },
          ],
        },
      },
      player: null,
    };
  }

  const lang = fr ? Lang.French : Lang.English;
  const playerWithoutTeam = { ...player } as Record<string, unknown>;
  delete playerWithoutTeam.team;
  delete playerWithoutTeam.specialAttackReady;
  delete playerWithoutTeam.specialAttackCurrentRounds;
  playerWithoutTeam.name = player.name[lang === Lang.French ? 0 : 1];

  if (!player) {
    return {
      command: {
        type: 4,
        data: {
          embeds: [
            {
              description: fr
                ? 'Personnage invalide. Choisissez 0-3 (Kazuma, Darkness, Megumin, Aqua).'
                : 'Invalid character. Choose 0-3 (Kazuma, Darkness, Megumin, Aqua).',
            },
          ],
        },
      },
      player: null,
    };
  }

  const charName = player.name[fr ? 1 : 0];
  const hp = player.hp;
  const attackR = player.attack;
  const lore = fr ? player.lore[0] : player.lore[1];

  const imgUrl = `https://fox3000foxy.com/konosuba-rpg/assets/player/${player.images[0]}.webp`;
  return {
    command: {
      type: 4,
      data: {
        embeds: [
          {
            description: fr
              ? `# Informations sur ${charName}:\n\n**Nom**: ${charName}\n**PV**: ${hp} PV\n**ATK**: ${attackR[0]}-${attackR[1]} points de dégâts.` +
                `\n\n${lore}`
              : `# Player infos for ${charName}:\n\n**Name**: ${charName}\n**HP**: ${hp} HP\n**ATK**: ${attackR[0]}-${attackR[1]} damage points.` +
                `\n\n${lore}`,
            image: { url: imgUrl },
            color: 0x2b2d31,
          },
        ],
      },
    },
    player: playerWithoutTeam as Omit<Player, 'team'>,
  };
}

export async function handleInfosPlayerCommand(
  c: Context,
  fr: boolean,
  characterId: number
) {
  return c.json(generatePlayerInfos(fr, characterId).command);
}
