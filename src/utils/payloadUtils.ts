/** Utility functions for payload manipulation */

const ACTION_PATHS: Record<string, string> = {
  a: "/atk",
  d: "/def",
  g: "/giv",
  h: "/hug",
  s: "/hea",
  p: "/spe",
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
