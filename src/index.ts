import { serve } from '@hono/node-server';
import { Context, Env, Hono } from 'hono';
import { serveStatic } from 'hono/serve-static';
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

app.use('/konosuba-rpg/assets/*', serveStatic({
  root: process.cwd() + '/assets',
  getContent: function (path: string, c: Context<Env, any, {}>): Promise<Response | null> {
    throw new Error('Function not implemented.');
  }
}));

app.get('/konosuba-rpg/:lang/*', async (c: Context) => {
  const { lang } = c.req.param();
  const [rand, moves, seed_str, monster] = await processUrl(c.req.url);
  const buffer = await processGame(rand, moves, monster, lang);
  c.header('Content-Type', 'image/png');
  return c.body(buffer);
});

app.post('/discordmon/interactions', async (c: Context) => {
  const interaction = await c.req.json();
  const lang = interaction?.guild?.features?.includes('COMMUNITY')
    ? interaction?.guild_locale
    : interaction?.locale;
  const userID = interaction?.member?.user?.id || interaction.user.id;

  if (interaction.type === 1) {
    return c.json({ type: 1 });
  }

  if (interaction.data?.name === 'start') {
    const id = makeid(15);
    return c.json({
      type: 4,
      data: {
        embeds: [
          {
            image: { url: `https://stella.jsannier.fr/konosuba-rpg/${lang}/${id}` },
            description: lang === 'fr' ? `**Partie de <@${userID}>**` : `**<@${userID}> game**`,
            color: 0x2b2d31,
          },
        ],
        components: [
          {
            type: 1,
            components: [
              { type: 2, label: lang === 'fr' ? 'Attaquer 1 fois' : 'Attack 1 time', style: 4, custom_id: `${id}/a:${userID}` },
              { type: 2, label: lang === 'fr' ? 'Attaquer 4 fois' : 'Attack 4 times', style: 4, custom_id: `${id}/aaaa:${userID}` },
              { type: 2, label: lang === 'fr' ? 'Câliner 1 fois' : 'Hug 1 time', style: 1, custom_id: `${id}/h:${userID}` },
              { type: 2, label: lang === 'fr' ? 'Câliner 4 fois' : 'Hug 4 times', style: 1, custom_id: `${id}/hhhh:${userID}` },
              { type: 2, label: lang === 'fr' ? 'Se défendre' : 'Defend', style: 3, custom_id: `${id}/d:${userID}` },
            ],
          },
        ],
      },
    });
  }

  return c.json({ error: 'Unknown interaction' }, 400);
});

export default app;

serve({
  fetch: app.fetch,
  port: 8787,
});
console.log('Server running on http://localhost:8787');