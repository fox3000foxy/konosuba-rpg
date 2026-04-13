import type { Context } from "hono";
import type { Lang } from "../objects/enums/Lang";
import { serializeGameForApi } from "../services/gameSerializer";
import { calculateGameStateFromUrl } from "../services/gameService";

export async function calculateGame(c: Context) {
  const { lang } = c.req.param() as { lang: Lang };
  const userId = c.req.query("userId");
  const game = await calculateGameStateFromUrl(c.req.url, lang, userId);
  return c.json(serializeGameForApi(game, lang));
}
