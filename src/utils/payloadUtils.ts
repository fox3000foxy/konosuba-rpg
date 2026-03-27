/** Utility functions for payload manipulation */

/** Reconstruit l'URL de jeu à partir du customId brut */
export function customIdToPath(payload: string): string {
  return payload.replace(/[adhgsp]/g, (match) => {
    switch (match) {
      case "a": return "/atk";
      case "d": return "/def";
      case "g": return "/giv";
      case "h": return "/hug";
      case "s": return "/hea";
      case "p": return "/spe";
      default: return "";
    }
  });
}

/** Détermine si le payload correspond à une session d'entraînement */
export function isTraining(payload: string): boolean {
  return payload.startsWith("train.");
}

/** Extrait le nom du monstre depuis un payload de training */
export function extractMonster(payload: string): string {
  const parts = payload.split(".");
  return parts[1] || "Troll";
}
