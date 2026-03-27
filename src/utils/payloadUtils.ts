/** Utility functions for payload manipulation */

/** Reconstruit l'URL de jeu à partir du customId brut */
export function customIdToPath(payload: string): string {
  return payload
    .split("a")
    .join("/atk")
    .split("d")
    .join("/def")
    .split("g")
    .join("/giv")
    .split("h")
    .join("/hug")
    .split("s")
    .join("/hea")
    .split("p")
    .join("/spe");
}

/** Détermine si le payload correspond à une session d'entraînement */
export function isTraining(payload: string): boolean {
  return payload.startsWith("train.");
}

/** Extrait le nom du monstre depuis un payload de training */
export function extractMonster(payload: string): string {
  return payload.split(".")[1] || "Troll";
}
