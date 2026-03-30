/** Utility functions for image URL generation */

import { BASE_URL } from '../objects/config/constants';
import {
  customIdToPath,
  extractDifficulty,
  extractMonster,
  isTraining,
  removeDifficultyFromPayload,
} from './payloadUtils';

/** Construit l'URL d'image pour un payload donné */
export function buildImageUrl(
  payload: string,
  lang: string,
  difficulty?: string | null,
  userId?: string
): string {
  // Extraire la difficulté du payload si elle n'est pas fournie
  const cleanPayload = removeDifficultyFromPayload(payload);
  const payloadDifficulty = extractDifficulty(payload);
  const effectiveDifficulty = difficulty || payloadDifficulty;

  const path = customIdToPath(cleanPayload);
  const training = isTraining(cleanPayload);
  const monsterName = training ? extractMonster(cleanPayload) : '';
  const queryParams = new URLSearchParams();

  if (training) {
    queryParams.append('training', 'true');
    queryParams.append('monster', monsterName);
  }

  if(userId) {
    queryParams.append('userId', userId);
  }

  if (effectiveDifficulty) {
    queryParams.append('difficulty', effectiveDifficulty);
  }

  const query = queryParams.toString() ? `/?${queryParams.toString()}` : '';
  return `${BASE_URL}/konosuba-rpg/${lang}/${path}${query}`;
}
