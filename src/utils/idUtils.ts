/** Utility functions for ID generation and manipulation */

/** Generates a random ID of a given length */
export function makeid(length: number): string {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZbcefijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result + "/";
}

/** Génère l'ID "Recommencer" en effaçant les lettres d'action */
export function restartId(payload: string): string {
  return payload
    .split("/")
    .join("")
    .split("train")
    .join("trqin")
    .split("a")
    .join("")
    .split("trqin")
    .join("train")
    .split("d")
    .join("")
    .split("g")
    .join("")
    .split("h")
    .join("")
    .split("s")
    .join("")
    .split("p")
    .join("");
}
