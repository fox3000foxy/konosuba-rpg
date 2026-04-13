import { type Context } from "hono";
import { type Lang } from "../../objects/enums/Lang";
import { buildComponents } from "../../utils/componentsBuilder";
import { makeid } from "../../utils/idUtils";
import { buildImageUrl } from "../../utils/imageUtils";

export async function handleStartCommand(c: Context, userID: string, lang: Lang, fr: boolean, difficulty?: string) {
  const id = makeid(15);
  difficulty = difficulty?.toLowerCase().replace(/\s/g, "_");
  const imageUrl = buildImageUrl(id, lang, difficulty);
  const buildedComponents = await buildComponents(id, userID, lang, false, difficulty);
  const { embedDescription, buttons } = buildedComponents;
  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          image: { url: imageUrl },
          description: (fr ? `**Partie de <@${userID}>**` : `**<@${userID}> game**`) + (difficulty ? `\n${fr ? "Difficulté" : "Difficulty"}: **${difficulty}**` : "") + (embedDescription.length > 0 ? `\n\n${embedDescription.join("\n")}` : ""),
          color: 0x2b2d31,
        },
      ],
      components: buttons,
    },
  });
}
