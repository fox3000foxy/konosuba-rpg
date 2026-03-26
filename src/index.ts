import { verifyKey } from 'discord-interactions';
import * as fs from 'fs/promises';
import { Context, Hono } from 'hono';
import { serveStatic } from 'hono/serve-static';
import { Aqua, Darkness, Kazuma, Megumin } from './classes/Player';
import { Random } from './classes/Random';
import { imageManifest } from './data/imageManifest';
import { mobMap } from './data/mobMap';
import { ButtonsLabels } from './enums/ButtonsLabels';
import { GameState } from './enums/GameState';
import { Lang } from './enums/Lang';
import { InteractionDataOption } from './types/InteractionDataOption';
import processGame from './utils/processGame';
import processUrl from './utils/processUrl';

const app = new Hono();

function makeid(length: number): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZbcefijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

/** Reconstruit l'URL de jeu à partir du customId brut (ex: "ABC123/a" → "/atk", etc.) */
function customIdToPath(payload: string): string {
  return payload
    .split('a').join('/atk')
    .split('d').join('/def')
    .split('g').join('/giv')
    .split('h').join('/hug');
}

/** Génère l'ID "Recommencer" en effaçant les lettres d'action (comme dans le JS d'origine) */
function restartId(payload: string): string {
  return payload
    .split('/').join('')
    .split('train').join('trqin')
    .split('a').join('')
    .split('trqin').join('train')
    .split('d').join('')
    .split('g').join('')
    .split('h').join('');
}

/** Détermine si le payload correspond à une session d'entraînement */
function isTraining(payload: string): boolean {
  return payload.startsWith('train.');
}

/** Extrait le nom du monstre depuis un payload de training (ex: "train.Troll.ABC123") */
function extractMonster(payload: string): string {
  return payload.split('.')[1] || 'Troll';
}

const BASE_URL = 'https://konosuba-rpg.vercel.app';

/** Construit l'URL d'image pour un payload donné */
function buildImageUrl(payload: string, lang: string): string {
  const path = customIdToPath(payload);
  const training = isTraining(payload);
  const monsterName = training ? extractMonster(payload) : '';
  return `${BASE_URL}/konosuba-rpg/${lang}/${path}${training ? `/?training=true&monster=${encodeURIComponent(monsterName)}` : ''}`;
}

/** Génère les deux rangées de boutons (identique JS d'origine) */
async function buildComponents(payload: string, userID: string, lang: string, disableChangeMonster = false) {
  const imageUrl = buildImageUrl(payload, lang);

  // const game = processGame
  const [rand, moves, , monster] = processUrl(imageUrl);
  const { state } = await processGame(rand, moves, monster, lang, false);
  const training = isTraining(payload);
  const fr = lang === Lang.French;

  if (state === GameState.Incomplete) {
    disableChangeMonster = true;
  }

  if (state === GameState.Good || state === GameState.Bad || state === GameState.Best || state === "giveup") { // GameState.Giveup n'est pas reconnu
    return [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: fr ? ButtonsLabels.RestartFr : ButtonsLabels.Restart,
            style: 2,
            custom_id: `${restartId(payload)}:${userID}`,
          },
          {
            type: 2,
            label: fr ? ButtonsLabels.GiveUpFr : ButtonsLabels.GiveUp,
            style: 2,
            custom_id: `${payload}/g:${userID}`,
          },
          {
            type: 2,
            label: fr ? ButtonsLabels.ChangeMonsterFr : ButtonsLabels.ChangeMonster,
            style: 2,
            // En training : le bouton est désactivé (comme dans le JS). En partie normale : nouveau seed.
            custom_id: training
              ? `train.${extractMonster(payload)}.${makeid(10)}:${userID}`
              : `${makeid(15)}:${userID}`
          },
        ],
      },
    ]
  }

  return [
    {
      type: 1,
      components: [
        { type: 2, label: fr ? ButtonsLabels.AttackFr.replace("x", "1") : ButtonsLabels.Attack.replace("x", "1"), style: 4, custom_id: `${payload}/a:${userID}` },
        { type: 2, label: fr ? ButtonsLabels.AttackFr.replace("x", "4") : ButtonsLabels.Attack.replace("x", "4"), style: 4, custom_id: `${payload}/aaaa:${userID}` },
        { type: 2, label: fr ? ButtonsLabels.AttackFr.replace("x", "10") : ButtonsLabels.Attack.replace("x", "10"), style: 4, custom_id: `${payload}/aaaaaaaaaa:${userID}` },
      ],
    }, {
      type: 1,
      components: [
        { type: 2, label: fr ? ButtonsLabels.HugFr.replace("x", "1") : ButtonsLabels.Hug.replace("x", "1"), style: 1, custom_id: `${payload}/h:${userID}` },
        { type: 2, label: fr ? ButtonsLabels.HugFr.replace("x", "4") : ButtonsLabels.Hug.replace("x", "4"), style: 1, custom_id: `${payload}/hhhh:${userID}` },
        { type: 2, label: fr ? ButtonsLabels.HugFr.replace("x", "10") : ButtonsLabels.Hug.replace("x", "10"), style: 1, custom_id: `${payload}/hhhhhhhhhh:${userID}` },
      ],
    },
    {
      type: 1,
      components: [
        { type: 2, label: fr ? ButtonsLabels.DefendFr : ButtonsLabels.Defend, style: 3, custom_id: `${payload}/d:${userID}` },
      ],
    },

    {
      type: 1,
      components: [
        {
          type: 2,
          label: fr ? ButtonsLabels.RestartFr : ButtonsLabels.Restart,
          style: 2,
          custom_id: `${restartId(payload)}:${userID}`,
        },
        {
          type: 2,
          label: fr ? ButtonsLabels.GiveUpFr : ButtonsLabels.GiveUp,
          style: 2,
          custom_id: `${payload}/g:${userID}`,
        },
        {
          type: 2,
          label: fr ? ButtonsLabels.ChangeMonsterFr : ButtonsLabels.ChangeMonster,
          style: 2,
          // En training : le bouton est désactivé (comme dans le JS). En partie normale : nouveau seed.
          custom_id: training
            ? `train.${extractMonster(payload)}.${makeid(10)}:${userID}`
            : `${makeid(15)}:${userID}`,
          disabled: disableChangeMonster || training,
        },
      ],
    },
  ];
}

app.get('/konosuba-rpg/assets/*', serveStatic({
  root: process.cwd() + '/assets',
  getContent: async function (path: string): Promise<Response | null> {
    const url = new URL(path, 'http://localhost');
    const key = url.pathname.split('assets/')[2];
    const image = imageManifest[key];
    if (!image) {
      console.warn(`Asset not found: ${key}`);
      return null;
    }

    const res = await fetch(image);
    if (!res.ok) {
      console.warn(`Failed to fetch asset ${key} from ${image}: HTTP ${res.status}`);
      return null;
    }

    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/webp',
      },
    });
  },
}));

// /raw_assets/* pour servir les images sans passer par le manifest (utile pour le développement et les tests)
app.get('/assets/*', serveStatic({
  root: process.cwd() + '/assets',
  getContent: async function (path: string): Promise<Response | null> {
    const url = new URL(path, 'http://localhost');
    const key = url.pathname.split('assets/')[2];
    const filePath = process.cwd() + '/assets/' + key;
    try {
      const buffer = await fs.readFile(filePath);
      return new Response(buffer, { headers: { 'Content-Type': 'image/webp' } });
    } catch (err) {
      console.warn(`Failed to read raw asset ${key} from ${filePath}:`, err);
      return null;
    }
  },
}));

app.get('/game/:lang/*', async (c: Context) => {
  console.log('Received request:', c.req.url);
  const { lang } = c.req.param();
  const [rand, moves, , monster] = await processUrl(c.req.url);
  const game = await processGame(rand, moves, monster, lang, false);
  return c.json(game);
})

app.get('/konosuba-rpg/:lang/*', async (c: Context) => {
  console.log('Received request:', c.req.url);
  const { lang } = c.req.param();
  const [rand, moves, , monster] = await processUrl(c.req.url);
  const { image } = await processGame(rand, moves, monster, lang, true);

  if (!image) {
    return c.text('Image generation failed', 500);
  }

  c.header('Content-Type', 'image/webp');
  const responseBody =
    image instanceof Uint8Array
      ? image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength)
      : image;

  return new Response(responseBody as ArrayBuffer, {
    headers: {
      'Content-Type': 'image/webp',
    },
  });
});

app.post('/api/interactions', async (c: Context) => {
  const signature = c.req.header('x-signature-ed25519');
  const timestamp = c.req.header('x-signature-timestamp');
  const body = await c.req.text();

  if (!c.env) return c.text('Environment variables not found', 500);
  const PUBLIC_KEY = (c.env.PUBLIC_KEY as string) || '8d61a524ccac360a3fd47de09c8df98487e7bec67884e4004feee5b1eb81062d';

  if (!signature || !timestamp || !PUBLIC_KEY) {
    if (!signature) console.warn('Missing signature');
    if (!timestamp) console.warn('Missing timestamp');
    if (!PUBLIC_KEY) console.warn('Missing public key');
    return c.text('invalid request headers', 400);
  }

  const isValid = await verifyKey(body, signature, timestamp, PUBLIC_KEY);
  // console.log(isValid ? 'Valid request signature' : 'Invalid request signature');
  if (!isValid) {
    console.warn('Invalid request signature');
    return c.text('invalid request signature', 401);
  }

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
      return c.json({
        type: 4,
        data: {
          embeds: [{
            image: { url: imageUrl },
            description: fr ? `**Partie de <@${userID}>**` : `**<@${userID}> game**`,
            color: 0x2b2d31,
          }],
          components: await buildComponents(id, userID, lang),
        },
      });
    }

    // /train
    if (interaction.data?.name === 'train') {
      const commandMonster = interaction.data.options?.find((o: InteractionDataOption) => o.name === 'monster')?.value;
      const monsterCandidate = typeof commandMonster === 'string' ? commandMonster.trim().toLowerCase() : '';
      const monsterKey = Object.keys(mobMap).find((k) => k.toLowerCase() === monsterCandidate) || 'Troll';
      const id = makeid(10);
      const payload = `train.${monsterKey}.${id}`;
      const imageUrl = buildImageUrl(payload, lang);

      return c.json({
        type: 4,
        data: {
          embeds: [{
            image: { url: imageUrl },
            description: fr
              ? `**Entraînement contre ${monsterKey} (joueur <@${userID}>)**`
              : `**Training vs ${monsterKey} (player <@${userID}>)**`,
            color: 0x2b2d31,
          }],
          components: await buildComponents(payload, userID, lang),
        },
      });
    }

    // /infos-monster
    if (interaction.data?.name === 'infos-monster') {
      const commandMonster = interaction.data.options?.find((o: InteractionDataOption) => o.name === 'monster')?.value;
      const monsterCandidate = typeof commandMonster === 'string' ? commandMonster.trim().toLowerCase() : '';
      const monsterKey = Object.keys(mobMap).find((k) => k.toLowerCase() === monsterCandidate);
      if (!monsterKey) {
        const allMobs = Object.keys(mobMap).sort();
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

      const rand = new Random(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
      const MonsterClass = mobMap[monsterKey];
      const monster = new MonsterClass(rand);
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

      const randP = new Random(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
      let player: Kazuma | Darkness | Megumin | Aqua;
      switch (characterId) {
        case 0:
          player = new Kazuma(randP);
          break;
        case 1:
          player = new Darkness(randP);
          break;
        case 2:
          player = new Megumin(randP);
          break;
        case 3:
          player = new Aqua(randP);
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
    const payload = colonIdx !== -1 ? customId.slice(0, colonIdx) : customId;
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

    return c.json({
      // type 7 si le propriétaire est le même joueur, type 4 si "all" (comme dans le JS)
      type: owner === userID ? 7 : 4,
      data: {
        embeds: [{
          image: { url: imageUrl },
          description: training
            ? (fr ? `Entraînement contre ${monsterName}` : `Training vs ${monsterName}`)
            : (fr ? `**Partie de <@${userID}>**` : `**<@${userID}> game**`),
          color: 0x2b2d31,
        }],
        components: await buildComponents(payload, userID, lang),
      },
    });
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