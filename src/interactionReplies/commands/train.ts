import { type Context } from "hono";
import { generateMob } from "../../objects/data/mobMap";
import { Lang } from "../../objects/enums/Lang";
import { type InteractionDataOption } from "../../objects/types/InteractionDataOption";
import { buildComponents } from "../../utils/componentsBuilder";
import { makeid } from "../../utils/idUtils";
import { buildImageUrl } from "../../utils/imageUtils";
import { pascalCaseToString } from "../../utils/processGame";

export async function handleTrainCommand(c: Context, userID: string, lang: Lang, fr: boolean, options: InteractionDataOption[]) {
  const mobs = generateMob();
  const commandMonster = options.find((o) => o.name === "monster")?.value;
  const langIndex = lang === Lang.French ? 1 : 0;
  const monsterCandidate = typeof commandMonster === "string" ? commandMonster.trim().toLowerCase() : "";
  const monster = mobs.find((k) => k.name[langIndex].toLowerCase() === monsterCandidate);
  if (!monster) {
    const allMobs = mobs.map((m) => m.name[langIndex] || m.constructor.name || pascalCaseToString(m.constructor.name)).sort();
    return c.json({
      type: 4,
      data: {
        embeds: [
          {
            description: fr ? `Monstre invalide. Monstres valides: ${allMobs.join(", ")}` : `Invalid monster. Valid monsters: ${allMobs.join(", ")}`,
          },
        ],
      },
    });
  }

  const monsterKey = monster.name[langIndex] || monster.constructor.name || pascalCaseToString(monster.constructor.name);
  const id = makeid(10);
  const payload = `train.${monsterKey}.${id}`;
  const imageUrl = buildImageUrl(payload, lang);
  const { embedDescription, buttons } = await buildComponents(payload, userID, lang);
  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          image: { url: imageUrl },
          description: (fr ? `**Entraînement contre ${monsterKey} (joueur <@${userID}>)**` : `**Training vs ${monsterKey} (player <@${userID}>)**`) + (embedDescription.length > 0 ? `\n\n${embedDescription.join("\n")}` : ""),
          color: 0x2b2d31,
        },
      ],
      components: buttons,
    },
  });
}
