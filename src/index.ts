import { Context, Hono } from 'hono';
import { Aqua, Darkness, Kazuma, Megumin } from './classes/Player';
import { BASE_URL } from './config/constants';
import { generateMob } from './data/mobMap';
import { serveKonosubaAssets, serveStaticAssets } from './routes/assets';
import { calculateGame } from './routes/game';
import { calculateRPG } from './routes/rpg';
import { InteractionDataOption } from './types/InteractionDataOption';
import { buildComponents, buildImageUrl, decompressMoves, extractMonster, followUpTimeout, isTraining, makeid, verifySignature } from './utils/helpers';
import processGame, { pascalCaseToString } from './utils/processGame';
import processUrl from './utils/processUrl';

const app = new Hono();

app.get('/konosuba-rpg/assets/*', serveKonosubaAssets);
app.get('/assets/*', serveStaticAssets);
app.get('/game/:lang/*', calculateGame);
app.get('/konosuba-rpg/:lang/*', calculateRPG);
app.post('/api/interactions', async (c: Context) => {
  const body = await c.req.text();
  await verifySignature(c, body);

  const interaction = JSON.parse(body);
  const lang = interaction?.guild?.features?.includes('COMMUNITY')
    ? interaction?.guild_locale
    : interaction?.locale;
  const userID = interaction?.member?.user?.id || interaction.user.id;
  const fr = lang === 'fr';

  // ── Ping ──────────────────────────────────────────────────────────────────
  if (interaction.type === 1) {
    return c.json({ type: 1 });
  }

  // ── Commandes slash ────────────────────────────────────────────────────────
  if (interaction.type === 2) {
    // /start
    if (interaction.data?.name === 'start') {
      const id = makeid(15);
      const imageUrl = buildImageUrl(id, lang);
      const buildedComponents = await buildComponents(id, userID, lang);
      const { embedDescription, buttons } = buildedComponents;
      return c.json({
        type: 4,
        data: {
          embeds: [{
            image: { url: imageUrl },
            description: (fr ? `**Partie de <@${userID}>**` : `**<@${userID}> game**`) + (embedDescription.length > 0 ? `\n\n${embedDescription.join('\n')}` : ''),
            color: 0x2b2d31,
          }],
          components: buttons,
        },
      });
    }

    // /train
    if (interaction.data?.name === 'train') {
      const commandMonster = interaction.data.options?.find((o: InteractionDataOption) => o.name === 'monster')?.value;
      console.log(`Received /train command with monster: ${commandMonster}`);
      const monsterCandidate = typeof commandMonster === 'string' ? commandMonster.trim().toLowerCase() : '';
      const monster = Object.values(generateMob()).find((k) => k.name.toLowerCase() === monsterCandidate);
      if (!monster) {
        const allMobs = Object.values(generateMob()).sort();
        return c.json({
          type: 4,
          data: {
            embeds: [{
              description: fr
                ? `Monstre invalide. Monstres valides: ${allMobs.join(', ')}`
                : `Invalid monster. Valid monsters: ${allMobs.join(', ')}`,
            }],
          },
        });
      }

      const monsterKey = monster.name || monster.constructor.name || pascalCaseToString(monster.constructor.name);
      const id = makeid(10);
      const payload = `train.${monsterKey}.${id}`;
      console.log(`Starting training session for ${userID} against ${monsterKey} with payload: ${payload}`);
      const imageUrl = buildImageUrl(payload, lang);
      const { embedDescription, buttons } = await buildComponents(payload, userID, lang);
      return c.json({
        type: 4,
        data: {
          embeds: [{
            image: { url: imageUrl },
            description: (fr
              ? `**Entraînement contre ${monsterKey} (joueur <@${userID}>)**`
              : `**Training vs ${monsterKey} (player <@${userID}>)**`) + (embedDescription.length > 0 ? `\n\n${embedDescription.join('\n')}` : ''),
            color: 0x2b2d31,
          }],
          components: buttons,
        },
      });
    }

    // /infos-monster
    if (interaction.data?.name === 'infos-monster') {
      const commandMonster = interaction.data.options?.find((o: InteractionDataOption) => o.name === 'monster')?.value;
      const monsterCandidate = typeof commandMonster === 'string' ? commandMonster.trim().toLowerCase() : '';
      const monsterKey = Object.keys(generateMob()).find((k) => k.toLowerCase() === monsterCandidate);
      if (!monsterKey) {
        const allMobs = Object.keys(generateMob()).sort();
        return c.json({
          type: 4,
          data: {
            embeds: [{
              description: fr
                ? `Ce monstre est invalide. Voici les monstres valides: ${allMobs.join(', ')}`
                : `Invalid monster. Valid monsters: ${allMobs.join(', ')}`,
            }],
          },
        });
      }

      const monster = generateMob().find(m => m.name || m.constructor.name || pascalCaseToString(m.constructor.name) === monsterKey);

      if (!monster) {
        const allMobs = Object.keys(generateMob()).sort();
        return c.json({
          type: 4,
          data: {
            embeds: [{
              description: fr
                ? `Ce monstre est invalide. Voici les monstres valides: ${allMobs.join(', ')}`
                : `Invalid monster. Valid monsters: ${allMobs.join(', ')}`,
            }],
          },
        });
      }

      const imgUrl = `${BASE_URL}/konosuba-rpg/assets/${monster.images[0]}`;

      return c.json({
        type: 4,
        data: {
          embeds: [{
            description: fr
              ? `# Informations de monstre:\n\n**Nom**: ${monster.name}\n**PV**: ${monster.hp} PV\n**ATK**: ${monster.attack[0]}-${monster.attack[1]} points de dégâts.\n**LP**: ${monster.love !== 100 ? monster.love + ' points d\'amour' : 'Ne peut pas être ami'}`
              : `# Monster infos:\n\n**Name**: ${monster.name}\n**HP**: ${monster.hp} HP\n**ATK**: ${monster.attack[0]}-${monster.attack[1]} damage points.\n**LP**: ${monster.love !== 100 ? monster.love + ' love points' : 'Can\'t be friends'}`,
            image: { url: imgUrl },
            color: 0x2b2d31,
          }],
        },
      });
    }

    // /infos-player
    if (interaction.data?.name === 'infos-player') {
      const characterId = Number(interaction.data.options?.find((o: InteractionDataOption) => o.name === 'character')?.value);
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
      console.log(imgUrl)
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