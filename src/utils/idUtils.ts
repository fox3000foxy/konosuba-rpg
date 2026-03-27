/** Utility functions for ID generation and manipulation */

/** Generates a random ID of a given length */
export function makeid(length: number): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZbcefijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * charactersLength))).join("") + "/";
}

/** Simplifies the restartId logic using a regex */
export function restartId(payload: string): string {
  return payload.replace(/[adhgsp]/g, "");
}
