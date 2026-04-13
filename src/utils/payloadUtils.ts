/** Utility functions for payload manipulation */

const ACTION_PATHS: Record<string, string> = {
  a: "/atk",
  d: "/def",
  g: "/giv",
  h: "/hug",
  s: "/hea",
  p: "/spe",
  u: "/use",
};

/** Reconstruit l'URL de jeu à partir du customId brut */
export function customIdToPath(payload: string): string {
  const slashIndex = payload.indexOf("/");
  if (slashIndex === -1) {
    return payload;
  }

  const head = payload.slice(0, slashIndex + 1);
  const actions = payload.slice(slashIndex + 1);

  let translated = "";
  for (let i = 0; i < actions.length; i += 1) {
    const segment = ACTION_PATHS[actions[i]];
    if (segment) {
      translated += segment;
    }
  }

  return head + translated;
}

/** Détermine si le payload correspond à une session d'entraînement */
export function isTraining(payload: string): boolean {
  return payload.startsWith("train.");
}

/** Extrait le nom du monstre depuis un payload de training */
export function extractMonster(payload: string): string {
  const firstDot = payload.indexOf(".");
  if (firstDot === -1) {
    return "Troll";
  }

  const secondDot = payload.indexOf(".", firstDot + 1);
  if (secondDot === -1) {
    return "Troll";
  }

  const monster = payload.slice(firstDot + 1, secondDot);
  return monster || "Troll";
}

/** Extrait la difficulté depuis un payload */
export function extractDifficulty(payload: string): string | null {
  const bracketIdx = payload.indexOf("[");
  if (bracketIdx === -1) {
    return null;
  }

  const closeBracketIdx = payload.indexOf("]", bracketIdx);
  if (closeBracketIdx === -1) {
    return null;
  }

  const difficulty = payload.slice(bracketIdx + 1, closeBracketIdx);
  return difficulty || null;
}

/** Ajoute la difficulté à un payload */
export function addDifficultyToPayload(payload: string, difficulty?: string | null): string {
  if (!difficulty) {
    return payload;
  }

  // Enlever la difficulté existante s'il y en a une
  const cleanPayload = payload.replace(/\[.*?\]/, "");
  return `${cleanPayload}[${difficulty}]`;
}

/** Enlève la difficulté du payload */
export function removeDifficultyFromPayload(payload: string): string {
  return payload.replace(/\[.*?\]/, "");
}
