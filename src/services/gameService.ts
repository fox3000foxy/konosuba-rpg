import { type Lang } from "../objects/enums/Lang";
import { type Game } from "../objects/types/Game";
import { withPerf } from "../utils/perfLogger";
import processGame from "../utils/processGame";
import { parseGameUrl } from "./urlService";

import { getCharacterStatsSnapshot } from "./progressionService";

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

export async function calculateGameStateFromUrl(url: string, lang: Lang, userID?: string): Promise<Game> {
  return withPerf("gameService", "calculateGameStateFromUrl", async () => {
    const { rand, moves, monster, difficulty } = parseGameUrl(url);
    const characterFactors = await getCharacterFactors(userID);
    return processGame(rand, moves, monster, lang, characterFactors, difficulty, userID);
  });
}
