import { Context } from 'hono';
import { Lang } from '../objects/enums/Lang';
import {
  calculateGameStateFromUrl,
  serializeGameForApi,
} from '../services/gameService';

export async function calculateGame(c: Context) {
  const { lang } = c.req.param() as { lang: Lang };
  const game = await calculateGameStateFromUrl(c.req.url, lang);
  return c.json(serializeGameForApi(game, lang));
}
