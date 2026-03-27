import { Context, Hono } from 'hono';
import { Lang } from './enums/Lang';
import { handleInfosMonsterCommand } from './interactionReplies/commands/infos-monster';
import { handleInfosPlayerCommand } from './interactionReplies/commands/infos-player';
import { handleStartCommand } from './interactionReplies/commands/start';
import { handleTrainCommand } from './interactionReplies/commands/train';
import { InteractionDataOption } from './objects/types/InteractionDataOption';
import { calculateGame } from './routes/game';
import { calculateRPG } from './routes/rpg';
import { buildComponents } from './utils/componentsBuilder';
import { followUpTimeout, verifySignature } from './utils/discordUtils';
import { buildImageUrl } from './utils/imageUtils';
import { decompressMoves } from './utils/movesUtils';
import { extractMonster, isTraining } from './utils/payloadUtils';
import processGame from './utils/processGame';
import processUrl from './utils/processUrl';

const app = new Hono();

app.get('/game/:lang/*', calculateGame);
app.get('/konosuba-rpg/:lang/*', calculateRPG);
app.post('/api/interactions', async (c: Context) => {
  const body = await c.req.text();
  const isVerified = await verifySignature(c, body);
  if (!isVerified) {
    return c.text('Invalid signature', 401);
  }

  const interaction = JSON.parse(body);
  const langString = interaction?.guild?.features?.includes('COMMUNITY')
    ? interaction?.guild_locale
    : interaction?.locale;
  const lang = Object.values(Lang).includes(langString) ? langString as Lang : Lang.English;
  const userID = interaction?.member?.user?.id || interaction.user.id;
  const fr = lang === Lang.French;

  // ── Ping ──────────────────────────────────────────────────────────────────
  if (interaction.type === 1) {
    return c.json({ type: 1 });
  }

  // ── Commandes slash ────────────────────────────────────────────────────────
  if (interaction.type === 2) {
    // /start
    if (interaction.data?.name === 'start') {
      return handleStartCommand(c, userID, lang, fr);
    }

    // /train
    if (interaction.data?.name === 'train') {
      return handleTrainCommand(c, userID, lang, fr, interaction.data.options);
    }

    // /infos-player
    if (interaction.data?.name === 'infos-player') {
      const characterId = Number(interaction.data.options?.find((o: InteractionDataOption) => o.name === 'character')?.value);
      return handleInfosPlayerCommand(c, userID, lang, fr, characterId);
    }

    // /infos-monster
    if (interaction.data?.name === 'infos-monster') {
      return handleInfosMonsterCommand(c, fr, interaction.data.options);
    }

    return c.json({ error: 'Unknown command' }, 400);
  }

  // ── Boutons (composants) ───────────────────────────────────────────────────
  if (interaction.type === 3 && interaction.data?.custom_id) {
    const customId: string = interaction.data.custom_id;
    const colonIdx = customId.lastIndexOf(':');
    const encodedPayload = colonIdx !== -1 ? customId.slice(0, colonIdx) : customId;
    const payload = decompressMoves(encodedPayload);
    const owner = colonIdx !== -1 ? customId.slice(colonIdx + 1) : '';

    // Vérification du propriétaire (comme dans le JS d'origine)
    if (owner && owner !== userID && owner !== 'all') {
      return c.json({
        type: 4,
        data: {
          content: fr ? "Ce n'est pas votre partie !" : 'Not your game!',
          flags: 1 << 6,
        },
      });
    }

    const training = isTraining(payload);
    const monsterName = training ? extractMonster(payload) : '';
    const imageUrl = buildImageUrl(payload, lang);

    console.log(`Button interaction with payload: ${payload}, owner: ${owner}, userID: ${userID}`);

    // return c.json({
    //   // type 7 si le propriétaire est le même joueur, type 4 si "all" (comme dans le JS)
    //   type: owner === userID ? 7 : 4,
    //   data: {
    //     embeds: [{
    //       image: { url: imageUrl },
    //       description: training
    //         ? (fr ? `Entraînement contre ${monsterName}` : `Training vs ${monsterName}`)
    //         : (fr ? `**Partie de <@${userID}>**` : `**<@${userID}> game**`),
    //       color: 0x2b2d31,
    //     }],
    //     components: await buildComponents(payload, userID, lang),
    //   },
    // });

    const { buttons, embedDescription } = (await buildComponents(payload, userID, lang));

    const special = interaction.data.custom_id.split(":")[0].endsWith('/p');
    if (special) {
      followUpTimeout(interaction, {
        type: owner === userID ? 7 : 4,
        data: {
          embeds: [{
            image: { url: imageUrl },
            description: (training
              ? (fr ? `Entraînement contre ${monsterName}` : `Training vs ${monsterName}`)
              : (fr ? `**Partie de <@${userID}>**` : `**<@${userID}> game**`)) + (embedDescription.length > 0 ? `\n\n${embedDescription.join('\n')}` : ''),
            color: 0x2b2d31,
          }],
          components: buttons,
        },
      }, 2000);

      const specialAttackLink = imageUrl.split('/konosuba-rpg/')[0]; // Extrait la partie avant "/konosuba-rpg/"

      // recalcule la partie pour voir qui est le joueur actif et construire l'URL de l'animation spéciale en conséquence
      const [rand, moves, , monster] = processUrl(imageUrl);
      const { team } = await processGame(rand, moves, monster, lang, false);
      const playerName = team.activePlayer?.name || 'Kazuma'; // Par défaut à Kazuma si quelque chose tourne mal

      const gifs: { [key: string]: string } = {
        "kazuma": "kazuma",
        "aqua": "aqua",
        "megumin": "meg",
        "darkness": "daku",
      }

      const specialAttackUrl = `${specialAttackLink}/assets/player/${gifs[playerName.toLowerCase()] || 'kazuma'}.gif`; // Construit l'URL de l'animation spéciale d'Aqua

      console.log(`Special attack triggered by ${playerName}, using animation from ${specialAttackUrl}`);
      return c.json({
        type: 7,
        data: {
          embeds: [{
            image: { url: specialAttackUrl },
            description: (training
              ? (fr ? `Entraînement contre ${monsterName}` : `Training vs ${monsterName}`)
              : (fr ? `**Partie de <@${userID}>**` : `**<@${userID}> game**`)) + (embedDescription.length > 0 ? `\n\n${embedDescription.join('\n')}` : ''),
            color: 0x2b2d31,
          }],
          components: buttons,
          // flags: 1 << 6,
        },
      });
    }
    else {
      return c.json({
        type: 7,
        data: {
          embeds: [{
            image: { url: imageUrl },
            description: (training
              ? (fr ? `Entraînement contre ${monsterName}` : `Training vs ${monsterName}`)
              : (fr ? `**Partie de <@${userID}>**` : `**<@${userID}> game**`)) + (embedDescription.length > 0 ? `\n\n${embedDescription.join('\n')}` : ''),
            color: 0x2b2d31,
          }],
          components: buttons,
          // flags: 1 << 6,
        },
      });
    }
  }
  return c.json({ error: 'Unknown interaction' }, 400);
});

export default app;

async function start() {
  // if (navigator.userAgent !== 'Cloudflare-Workers') {
  const serve = (await import('@hono/node-server')).serve;
  serve({ fetch: app.fetch, port: 8787 });
  console.log('Server running on http://localhost:8787');
  // }
}
start();
