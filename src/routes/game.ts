import { Context } from "vm";
import { Lang } from "../enums/Lang";
import processGame from "../utils/processGame";
import processUrl from "../utils/processUrl";

export async function calculateGame(c: Context) {
  console.log('Received request:', c.req.url);
  const { lang } = c.req.param() as { lang: Lang };
  const [rand, moves, , monster] = await processUrl(c.req.url);
  const game = await processGame(rand, moves, monster, lang, false);
  return c.json(game);
}