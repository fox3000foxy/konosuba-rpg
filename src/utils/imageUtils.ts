/** Utility functions for image URL generation */

import { BASE_URL } from "../config/constants";
import { customIdToPath, extractMonster, isTraining } from "./payloadUtils";

/** Construit l'URL d'image pour un payload donné */
export function buildImageUrl(payload: string, lang: string): string {
  const path = customIdToPath(payload);
  const training = isTraining(payload);
  const monsterName = training ? extractMonster(payload) : '';
  return `${BASE_URL}/konosuba-rpg/${lang}/${path}${training ? `/?training=true&monster=${encodeURIComponent(monsterName)}` : ''}`;
}