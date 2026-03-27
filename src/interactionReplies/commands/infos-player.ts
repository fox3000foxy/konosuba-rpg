import { Context } from 'hono';
import { Aqua, Darkness, Kazuma, Megumin } from '../../classes/Player';
import { BASE_URL } from '../../config/constants';

export async function handleInfosPlayerCommand(c: Context, userID: string, lang: string, fr: boolean, characterId: number) {
  if (!Number.isInteger(characterId) || characterId < 0 || characterId > 3) {
    return c.json({
      type: 4,
      data: {
        embeds: [{
          description: fr
            ? 'Personnage invalide. Choisissez 0-3 (Kazuma, Darkness, Megumin, Aqua).'
            : 'Invalid character. Choose 0-3 (Kazuma, Darkness, Megumin, Aqua).',
        }],
      },
    });
  }

  let player: Kazuma | Darkness | Megumin | Aqua;
  switch (characterId) {
    case 0:
      player = new Kazuma();
      break;
    case 1:
      player = new Darkness();
      break;
    case 2:
      player = new Megumin();
      break;
    case 3:
      player = new Aqua();
      break;
    default:
      return c.json({
        type: 4,
        data: {
          embeds: [{
            description: fr
              ? 'Personnage invalide. Choisissez 0-3 (Kazuma, Darkness, Megumin, Aqua).'
              : 'Invalid character. Choose 0-3 (Kazuma, Darkness, Megumin, Aqua).',
          }],
        },
      });
  }
  const charName = player.name;
  const hp = player.hp;
  const attackR = player.attack;
  const imgUrl = `${BASE_URL}/konosuba-rpg/assets/${player.images[0]}`;
  return c.json({
    type: 4,
    data: {
      embeds: [{
        description: fr
          ? `# Informations sur ${charName}:\n\n**Nom**: ${charName}\n**PV**: ${hp} PV\n**ATK**: ${attackR[0]}-${attackR[1]} points de dégâts.`
          : `# Player infos for ${charName}:\n\n**Name**: ${charName}\n**HP**: ${hp} HP\n**ATK**: ${attackR[0]}-${attackR[1]} damage points.`,
        image: { url: imgUrl },
        color: 0x2b2d31,
      }],
    },
  });
}