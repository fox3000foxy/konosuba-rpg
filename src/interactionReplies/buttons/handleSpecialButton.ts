import { Context } from "hono";
import { BASE_URL, DISCORD_API_URL } from "../../objects/config";
import { Interaction } from "../../objects/enums/Interaction";
import { Lang } from "../../objects/enums/Lang";
import { RawButton } from "../../objects/enums/RawButton";
import { buildBattleTitle } from "../../utils/battleTitle";
import { buildImageUrl } from "../../utils/imageUtils";

const GIFS_BY_PLAYER: Record<string, string> = {
  kazuma: "kazuma",
  aqua: "aqua",
  megumin: "meg",
  darkness: "daku",
};

export async function handleSpecialButton(interaction: Interaction, c: Context, payload: string, userID: string, lang: Lang, fr: boolean, monsterName: string, activePlayerName: string | null, embedDescription: string[], buttons: RawButton[]) {
  const imageUrl = buildImageUrl(payload, lang, undefined, userID);
  const title = buildBattleTitle(payload, fr, userID, monsterName);
  const description = embedDescription.length > 0 ? `${title}\n\n${embedDescription.join("\n")}` : title;

  const playerName = activePlayerName || "Kazuma";

  const specialAttackUrl = `${BASE_URL}/assets/player/${GIFS_BY_PLAYER[playerName.toLowerCase()] || "kazuma"}.gif`;
  const responseType = interaction.data.custom_id.split(":")[1] === userID ? 7 : 4;

  console.log(`Special attack triggered by ${playerName}, using animation from ${specialAttackUrl}`);

  // Update the original embed after the special attack animation finishes.
  void (async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    try {
      await fetch(`${DISCORD_API_URL}/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              image: { url: imageUrl },
              description,
              color: 0x2b2d31,
            },
          ],
          components: buttons,
        }),
      });
    } catch (error) {
      console.error("Failed to update special button message:", error);
    }
  })();

  return c.json({
    type: responseType,
    data: {
      embeds: [
        {
          image: { url: specialAttackUrl },
          description,
          color: 0x2b2d31,
        },
      ],
      components: buttons,
    },
  });
}
