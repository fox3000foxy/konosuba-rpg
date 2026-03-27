import { Context } from "hono";
import { Aqua, Darkness, Kazuma, Megumin } from "../../classes/Player";

export async function handleInfosPlayerCommand(
  c: Context,
  fr: boolean,
  characterId: number,
) {
  if (!Number.isInteger(characterId) || characterId < 0 || characterId > 3) {
    return c.json({
      type: 4,
      data: {
        embeds: [
          {
            description: fr
              ? "Personnage invalide. Choisissez 0-3 (Kazuma, Darkness, Megumin, Aqua)."
              : "Invalid character. Choose 0-3 (Kazuma, Darkness, Megumin, Aqua).",
          },
        ],
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
          embeds: [
            {
              description: fr
                ? "Personnage invalide. Choisissez 0-3 (Kazuma, Darkness, Megumin, Aqua)."
                : "Invalid character. Choose 0-3 (Kazuma, Darkness, Megumin, Aqua).",
            },
          ],
        },
      });
  }
  const charName = player.name[fr ? 1 : 0];
  const hp = player.hp;
  const attackR = player.attack;
  const imgUrl = `https://raw.githubusercontent.com/fox3000foxy/konosuba-rpg/refs/heads/main/assets/player/${player.images[0]}.webp`;
  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          description: fr
            ? `# Informations sur ${charName}:\n\n**Nom**: ${charName}\n**PV**: ${hp} PV\n**ATK**: ${attackR[0]}-${attackR[1]} points de dégâts.` +
              `\n\n${player.lore}`
            : `# Player infos for ${charName}:\n\n**Name**: ${charName}\n**HP**: ${hp} HP\n**ATK**: ${attackR[0]}-${attackR[1]} damage points.` +
              `\n\n${player.lore}`,
          image: { url: imgUrl },
          color: 0x2b2d31,
        },
      ],
    },
  });
}
