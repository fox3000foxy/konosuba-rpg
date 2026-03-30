/** Utility functions for image URL generation */

import { BASE_URL } from '../objects/config/constants';
import { customIdToPath, extractMonster, isTraining } from './payloadUtils';

/** Construit l'URL d'image pour un payload donné */
export function buildImageUrl(payload: string, lang: string, difficulty?: string): string {
  const path = customIdToPath(payload);
  const training = isTraining(payload);
  const monsterName = training ? extractMonster(payload) : '';
  const queryParams = new URLSearchParams();
  
  if (training) {
    queryParams.append('training', 'true');
    queryParams.append('monster', monsterName);
  }
  
  if (difficulty) {
    queryParams.append('difficulty', difficulty);
  }
  
  const query = queryParams.toString() ? `/?${queryParams.toString()}` : '';
  return `${BASE_URL}/konosuba-rpg/${lang}/${path}${query}`;
}
