import { Lang } from "../objects/enums/Lang";
import { Game } from "../objects/types/Game";
import { withPerf } from "../utils/perfLogger";
import processGame from "../utils/processGame";
import { parseGameUrl } from "./urlService";

export async function calculateGameStateFromUrlLight(url: string, lang: Lang, userID?: string): Promise<Game> {
  return withPerf("gameLightService", "calculateGameStateFromUrlLight", async () => {
    const { rand, moves, monster, difficulty } = parseGameUrl(url);
    return processGame(rand, moves, monster, lang, undefined, difficulty, userID);
  });
}
