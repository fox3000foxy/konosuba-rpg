import { verifyKey } from 'discord-interactions';
import { Context, Env, Hono } from 'hono';
import { serveStatic } from 'hono/serve-static';
import { imageManifest } from './utils/imageManifest';
import { mobMap } from './utils/mobMap';
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

const BASE_URL = 'https://71z3lhx5-8787.uks1.devtunnels.ms';

/** Construit l'URL d'image pour un payload donné */
function buildImageUrl(payload: string, lang: string): string {
  const path = customIdToPath(payload);
  const training = isTraining(payload);
  const monsterName = training ? extractMonster(payload) : '';
  return `${BASE_URL}/konosuba-rpg/${lang}/${path}${training ? `/?training=true&monster=${encodeURIComponent(monsterName)}` : ''}`;
}

/** Génère les deux rangées de boutons (identique JS d'origine) */
function buildComponents(payload: string, userID: string, lang: string, disableChangeMonster = false) {
  const training = isTraining(payload);
  const fr = lang === 'fr';

  return [
    {
      type: 1,
      components: [
        { type: 2, label: fr ? 'Attaquer 1 fois'  : 'Attack 1 time',  style: 4, custom_id: `${payload}/a:${userID}` },
        { type: 2, label: fr ? 'Attaquer 4 fois'  : 'Attack 4 times', style: 4, custom_id: `${payload}/aaaa:${userID}` },
        { type: 2, label: fr ? 'Câliner 1 fois'   : 'Hug 1 time',     style: 1, custom_id: `${payload}/h:${userID}` },
        { type: 2, label: fr ? 'Câliner 4 fois'   : 'Hug 4 times',    style: 1, custom_id: `${payload}/hhhh:${userID}` },
        { type: 2, label: fr ? 'Se défendre'       : 'Defend',         style: 3, custom_id: `${payload}/d:${userID}` },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 2,
          label: fr ? 'Recommencer' : 'Restart',
          style: 2,
          custom_id: `${restartId(payload)}:${userID}`,
        },
        {
          type: 2,
          label: fr ? 'Abandonner' : 'Give up',
          style: 2,
          custom_id: `${payload}/g:${userID}`,
        },
        {
          type: 2,
          label: fr ? 'Changer de monstre' : 'Change monster',
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

app.use('/konosuba-rpg/assets/*', serveStatic({
  root: process.cwd() + '/assets',
  getContent: async function (path: string, c: Context<Env, any, {}>): Promise<Response | null> {
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
        'Content-Type': 'image/png',
      },
    });
  },
}));

app.get('/konosuba-rpg/:lang/*', async (c: Context) => {
  console.log('Received request:', c.req.url);
  const { lang } = c.req.param();
  const [rand, moves, seed_str, monster] = await processUrl(c.req.url);
  const buffer = await processGame(rand, moves, monster, lang);
  c.header('Content-Type', 'image/png');
  return c.body(buffer);
});

app.post('/api/interactions', async (c: Context) => {
  const signature = c.req.header('x-signature-ed25519');
  const timestamp  = c.req.header('x-signature-timestamp');
  const body = await c.req.text();

  if (!c.env) return c.text('Environment variables not found', 500);
  const PUBLIC_KEY = (c.env.PUBLIC_KEY as string) || '8d61a524ccac360a3fd47de09c8df98487e7bec67884e4004feee5b1eb81062d';

  if (!signature || !timestamp || !PUBLIC_KEY) {
    if (!signature) console.warn('Missing signature');
    if (!timestamp)  console.warn('Missing timestamp');
    if (!PUBLIC_KEY) console.warn('Missing public key');
    return c.text('invalid request headers', 400);
  }

  const isValid = verifyKey(body, signature, timestamp, PUBLIC_KEY);
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
          components: buildComponents(id, userID, lang),
        },
      });
    }

    // /train
    if (interaction.data?.name === 'train') {
      const commandMonster = interaction.data.options?.find((o: any) => o.name === 'monster')?.value;
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
          components: buildComponents(payload, userID, lang),
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
    const owner   = colonIdx !== -1 ? customId.slice(colonIdx + 1) : '';

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
        components: buildComponents(payload, userID, lang),
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