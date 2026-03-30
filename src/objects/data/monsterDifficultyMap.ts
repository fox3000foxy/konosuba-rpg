import { MonsterDifficulty } from '../enums/MonsterDifficulty';
import { generateMob } from './mobMap';

interface MonsterStats {
  hpMax: number;
  attackMin: number;
  attackMax: number;
}

/**
 * Récupère les stats d'un monstre par son nom
 */
export function getMonsterStats(monsterName: string | null): MonsterStats | null {
  if (!monsterName) {
    return null;
  }

  const mobs = generateMob();
  const normalizedName = monsterName.toLowerCase().trim();

  for (const mob of mobs) {
    if (mob?.name?.[0]?.toLowerCase() === normalizedName) {
      return {
        hpMax: mob.hpMax,
        attackMin: mob.attack[0],
        attackMax: mob.attack[1],
      };
    }
  }

  return null;
}

/**
 * Calcule la difficulté du monstre basée sur ses stats
 * Formule: score = (hpMax / 100) + ((attackMin + attackMax) / 2)
 */
function calculateDifficultyScore(stats: MonsterStats): number {
  const hpScore = stats.hpMax / 100;
  const attackScore = (stats.attackMin + stats.attackMax) / 2;
  return hpScore + attackScore;
}

/**
 * Détermine le niveau de difficulté basé sur le score de difficulté
 */
export function getMonsterDifficulty(monsterName: string | null): MonsterDifficulty {
  const stats = getMonsterStats(monsterName);
  if (!stats) {
    return MonsterDifficulty.Medium; // Par défaut si le monstre n'est pas trouvé
  }

  const score = calculateDifficultyScore(stats);

  if (score < 10) {
    return MonsterDifficulty.Easy;
  }
  if (score < 20) {
    return MonsterDifficulty.Medium;
  }
  if (score < 35) {
    return MonsterDifficulty.Hard;
  }
  if (score < 50) {
    return MonsterDifficulty.VeryHard;
  }
  if (score < 80) {
    return MonsterDifficulty.Extreme;
  }

  return MonsterDifficulty.Legendary;
}
