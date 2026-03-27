import { Context, Hono } from "hono";
import { Interaction } from "./enums/Interaction";
import { Lang } from "./enums/Lang";
import { handleDefaultButton } from "./interactionReplies/buttons/handleDefaultButton";
import { handleSpecialButton } from "./interactionReplies/buttons/handleSpecialButton";
import { handleInfosMonsterCommand } from "./interactionReplies/commands/infos-monster";
import { handleInfosPlayerCommand } from "./interactionReplies/commands/infos-player";
import { handleStartCommand } from "./interactionReplies/commands/start";
import { handleTrainCommand } from "./interactionReplies/commands/train";
import { InteractionDataOption } from "./objects/types/InteractionDataOption";
import { calculateGame } from "./routes/game";
import { calculateRPG } from "./routes/rpg";
import { buildComponents } from "./utils/componentsBuilder";
import { verifySignature } from "./utils/discordUtils";
import { decompressMoves } from "./utils/movesUtils";
import { extractMonster, isTraining } from "./utils/payloadUtils";

const app = new Hono();

app.get("/game/:lang/*", calculateGame);
app.get("/konosuba-rpg/:lang/*", calculateRPG);
app.post("/api/interactions", async (c: Context) => {
  const body = await c.req.text();
  const isVerified = await verifySignature(c, body);
  if (!isVerified) {
    return c.text("Invalid signature", 401);
  }

  const interaction: Interaction = JSON.parse(body);
  const langString = interaction?.guild?.features?.includes("COMMUNITY")
    ? interaction?.guild_locale
    : interaction?.locale;
  const lang = Object.values(Lang).includes(langString)
    ? (langString as Lang)
    : Lang.English;
  const userID = interaction?.member?.user?.id || interaction.user.id;
  const fr = lang === Lang.French;

  // ── Ping ──────────────────────────────────────────────────────────────────
  if (interaction.type === 1) {
    return c.json({ type: 1 });
  }

  // ── Commandes slash ────────────────────────────────────────────────────────
  if (interaction.type === 2) {
    // /start
    if (interaction.data?.name === "start") {
      return handleStartCommand(c, userID, lang, fr);
    }

    // /train
    if (interaction.data?.name === "train") {
      if (!interaction.data.options || interaction.data.options.length === 0) {
        return c.json({
          type: 4,
          data: {
            content: fr
              ? "Veuillez spécifier un monstre. Exemple: /train goblin"
              : "Please specify a monster. Example: /train goblin",
          },
        });
      }
      return handleTrainCommand(c, userID, lang, fr, interaction.data.options);
    }

    // /infos-player
    if (interaction.data?.name === "infos-player") {
      const characterId = Number(
        interaction.data.options?.find(
          (o: InteractionDataOption) => o.name === "character",
        )?.value,
      );
      return handleInfosPlayerCommand(c, fr, characterId);
    }

    // /infos-monster
    if (interaction.data?.name === "infos-monster") {
      if (!interaction.data.options || interaction.data.options.length === 0) {
        return c.json({
          type: 4,
          data: {
            content: fr
              ? "Veuillez spécifier un monstre. Exemple: /infos-monster goblin"
              : "Please specify a monster. Example: /infos-monster goblin",
          },
        });
      }

      return handleInfosMonsterCommand(c, fr, interaction.data.options);
    }

    return c.json({ error: "Unknown command" }, 400);
  }

  // ── Boutons (composants) ───────────────────────────────────────────────────
  if (interaction.type === 3 && interaction.data?.custom_id) {
    const customId: string = interaction.data.custom_id;
    const colonIdx = customId.lastIndexOf(":");
    const encodedPayload =
      colonIdx !== -1 ? customId.slice(0, colonIdx) : customId;
    const payload = decompressMoves(encodedPayload);
    const owner = colonIdx !== -1 ? customId.slice(colonIdx + 1) : "";

    // Vérification du propriétaire (comme dans le JS d'origine)
    if (owner && owner !== userID && owner !== "all") {
      return c.json({
        type: 4,
        data: {
          content: fr ? "Ce n'est pas votre partie !" : "Not your game!",
          flags: 1 << 6,
        },
      });
    }

    const training = isTraining(payload);
    const monsterName = training ? extractMonster(payload) : "";
    const { buttons, embedDescription, activePlayerName } = await buildComponents(
      payload,
      userID,
      lang,
    );

    const special = interaction.data.custom_id.split(":")[0].endsWith("p");
    if (special) {
      return handleSpecialButton(
        interaction,
        c,
        payload,
        userID,
        lang,
        fr,
        monsterName,
        activePlayerName,
        embedDescription,
        buttons,
      );
    } else {
      return handleDefaultButton(
        c,
        payload,
        userID,
        lang,
        fr,
        monsterName,
        embedDescription,
        buttons,
      );
    }
  }
  return c.json({ error: "Unknown interaction" }, 400);
});

export default app;

async function start() {
  // if (navigator.userAgent !== 'Cloudflare-Workers') {
  const serve = (await import("@hono/node-server")).serve;
  serve({ fetch: app.fetch, port: 8787 });
  console.log("Server running on http://localhost:8787");
  // }
}
start();
