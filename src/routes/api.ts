import { Context, Hono } from 'hono';
import { readFileSync } from 'node:fs';
import { generateMonsterInfosByConstructorName } from '../interactionReplies/commands/infos-monster';
import { generatePlayerInfos } from '../interactionReplies/commands/infos-player';

const PLAYER_ID_BY_NAME: Record<string, number> = {
  kazuma: 0,
  darkness: 1,
  megumin: 2,
  aqua: 3,
};

function getApiLang(c: Context) {
  return c.req.query('lang') === 'fr';
}

export function registerApiRoutes(app: Hono): void {
  app.get('/assets/*', (c: Context) => {
    const basePath = 'https://konosuba-rpg.vercel.app/';
    const data = readFileSync(process.cwd() + `/assets${c.req.path.replace('/assets', '')}`);
    if (!data) {
      return c.redirect(basePath + `assets${c.req.path.replace('/assets', '')}`);
    }
    const contentType = getContentType(c.req.path);
    c.header('Content-Type', contentType);
    return c.body(data);
  });

  function getContentType(path: string): string {
    if (path.endsWith('.png')) return 'image/png';
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
    if (path.endsWith('.webp')) return 'image/webp';
    if (path.endsWith('.svg')) return 'image/svg+xml';
    if (path.endsWith('.otf')) return 'font/otf';
    return 'application/octet-stream';
  }

  app.get('/player/:playerName', (c: Context) => {
    const fr = getApiLang(c);
    const playerName = (c.req.param('playerName') || '').trim().toLowerCase();
    const characterId = PLAYER_ID_BY_NAME[playerName];

    if (characterId === undefined) {
      return c.json(
        {
          error: fr ? 'Personnage invalide. Utilisez Kazuma, Darkness, Megumin ou Aqua.' : 'Invalid player. Use Kazuma, Darkness, Megumin, or Aqua.',
        },
        400
      );
    }

    return c.json(generatePlayerInfos(fr, characterId).player);
  });

  app.get('/monster/:monsterConstructorName', (c: Context) => {
    const fr = getApiLang(c);

    const monsterConstructorName = c.req.param('monsterConstructorName') || '';
    const infos = generateMonsterInfosByConstructorName(monsterConstructorName, fr);
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
}
