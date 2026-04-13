import type { Lang } from "../objects/enums/Lang";
import type { Game } from "../objects/types/Game";
import { withPerf } from "../utils/perfLogger";
import processGameWithRender from "../utils/processGameWithRender";
import { getCharacterStatsSnapshot } from "./progressionService";
import { parseGameUrl } from "./urlService";

async function getCharacterFactors(userID?: string): Promise<number[] | undefined> {
  if (!userID) {
    return undefined;
  }

  const characterStatsSnapshot = await getCharacterStatsSnapshot(userID);
  if (!characterStatsSnapshot) {
    return undefined;
  }

  return characterStatsSnapshot.map((snapshot) => snapshot.factor);
}

export async function calculateGameImageFromUrl(url: string, lang: Lang, userID?: string): Promise<Game> {
  return withPerf("gameRenderService", "calculateGameImageFromUrl", async () => {
    const { rand, moves, monster, difficulty } = parseGameUrl(url);
    const characterFactors = await getCharacterFactors(userID);

    return processGameWithRender(rand, moves, monster, lang, characterFactors, difficulty, userID);
  });
}
