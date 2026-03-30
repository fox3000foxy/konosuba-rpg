import { config } from 'dotenv';
import { Context, Hono } from 'hono';
import {
  generateMonsterInfosByConstructorName
} from './interactionReplies/commands/infos-monster';
import { generatePlayerInfos } from './interactionReplies/commands/infos-player';
import { calculateGame } from './routes/game';
import { handleInteractions } from './routes/interactions';
import { calculateRPG } from './routes/rpg';
import { startServer } from './server/bootstrap';

config();

const app = new Hono();

const PLAYER_ID_BY_NAME: Record<string, number> = {
  kazuma: 0,
  darkness: 1,
  megumin: 2,
  aqua: 3,
};

function getApiLang(c: Context) {
  return c.req.query('lang') === 'fr';
}
app.get('/assets/*', (c: Context) => {
  const basePath = 'https://fox3000foxy.com/konosuba-rpg/';
  return c.redirect(`${basePath}${c.req.path}`);
});

app.get('/player/:playerName', (c: Context) => {
  const fr = getApiLang(c);
  const playerName = (c.req.param('playerName') || '').trim().toLowerCase();
  const characterId = PLAYER_ID_BY_NAME[playerName];

  if (characterId === undefined) {
    return c.json(
      {
        error: fr
          ? 'Personnage invalide. Utilisez Kazuma, Darkness, Megumin ou Aqua.'
          : 'Invalid player. Use Kazuma, Darkness, Megumin, or Aqua.',
      },
      400
    );
  }

  return c.json(generatePlayerInfos(fr, characterId).player);
});

app.get('/monster/:monsterConstructorName', (c: Context) => {
  const fr = getApiLang(c);

  const monsterConstructorName = c.req.param('monsterConstructorName') || '';
  const infos = generateMonsterInfosByConstructorName(
    monsterConstructorName,
    fr
  );
  if (!infos.creature) {
    return c.json(
      {
        error: fr ? 'Monstre non trouvé.' : 'Monster not found.',
        description: infos.command.data.embeds[0].description,
      },
      404
    );
  }

  return c.json(infos.creature);
});

app.get('/game/:lang/*', calculateGame);
app.get('/konosuba-rpg/:lang/*', calculateRPG);
app.post('/api/interactions', handleInteractions);

export default app;

async function start() {
  await startServer(app);
}
start();
