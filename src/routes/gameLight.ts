import { Context } from "hono";
import { Lang } from "../objects/enums/Lang";
import { calculateGameStateFromUrlLight } from "../services/gameLightService";
import { serializeGameForApi } from "../services/gameSerializer";

export async function calculateGameLight(c: Context) {
  const { lang } = c.req.param() as { lang: Lang };
  const userId = c.req.query("userId");
  const game = await calculateGameStateFromUrlLight(c.req.url, lang, userId);
  return c.json(serializeGameForApi(game, lang));
}
