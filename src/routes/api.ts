import { Context, Hono } from 'hono';
import { generateMonsterInfosByConstructorName } from '../interactionReplies/commands/infos-monster';
import { generatePlayerInfos } from '../interactionReplies/commands/infos-player';
import { getInventoryItems } from '../services/inventoryService';
import { getCharacterProgresses } from '../services/progressionService';
import { buildAffinitySvg, renderAffinityImage } from '../utils/renderAffinityImage';
import { buildSvg, renderInventoryImage } from '../utils/renderInventoryImage';

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

  app.get('/inventory/:userId', async (c: Context) => {
    const userId = (c.req.param('userId') || '').trim();
    const fr = getApiLang(c);

    if (!userId) {
      return c.text(fr ? 'Utilisateur invalide.' : 'Invalid user.', 400);
    }

    // if path contains "?renderSvg=true", return the svg instead of the png
    const renderSvg = c.req.query('renderSvg') === 'true';
    if (renderSvg) {
      const items = await getInventoryItems(userId);
      const image = await buildSvg(userId, items, fr);
      return c.text(image, 200, {
        'Content-Type': 'image/svg+xml',
        'Cache-Control':
          'public, max-age=0, s-maxage=15, stale-while-revalidate=60',
        'CDN-Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
        'Vercel-CDN-Cache-Control':
          'public, s-maxage=15, stale-while-revalidate=60',
      });
    }
    const items = await getInventoryItems(userId);
    const image = await renderInventoryImage(userId, items, fr);
    const responseBody = image.buffer.slice(
      image.byteOffset,
      image.byteOffset + image.byteLength
    );

    return new Response(responseBody as ArrayBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control':
          'public, max-age=0, s-maxage=15, stale-while-revalidate=60',
        'CDN-Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
        'Vercel-CDN-Cache-Control':
          'public, s-maxage=15, stale-while-revalidate=60',
      },
    });
  });

  app.get('/affinity/:userId', async (c: Context) => {
    const userId = (c.req.param('userId') || '').trim();
    const fr = getApiLang(c);

    if (!userId) {
      return c.text(fr ? 'Utilisateur invalide.' : 'Invalid user.', 400);
    }

    const progresses = await getCharacterProgresses(userId);
    if (!progresses) {
      return c.text(
        fr ? 'Affinite indisponible pour le moment.' : 'Affinity is unavailable right now.',
        404
      );
    }

    const renderSvg = c.req.query('renderSvg') === 'true';
    if (renderSvg) {
      const image = await buildAffinitySvg(userId, progresses, fr);
      return c.text(image, 200, {
        'Content-Type': 'image/svg+xml',
        'Cache-Control':
          'public, max-age=0, s-maxage=15, stale-while-revalidate=60',
        'CDN-Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
        'Vercel-CDN-Cache-Control':
          'public, s-maxage=15, stale-while-revalidate=60',
      });
    }

    const image = await renderAffinityImage(userId, progresses, fr);
    const responseBody = image.buffer.slice(
      image.byteOffset,
      image.byteOffset + image.byteLength
    );

    return new Response(responseBody as ArrayBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control':
          'public, max-age=0, s-maxage=15, stale-while-revalidate=60',
        'CDN-Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
        'Vercel-CDN-Cache-Control':
          'public, s-maxage=15, stale-while-revalidate=60',
      },
    });
  });
}
