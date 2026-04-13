import { MonsterDifficulty } from "../enums/MonsterDifficulty";
import { generateMob } from "./mobMap";

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
 * Seuils recalibrés pour une meilleure répartition:
 * - Easy: monstres très faibles (< 10)
 * - Medium: monstres faibles à moyens (10-15)
 * - Hard: monstres moyens à forts (15-25)
 * - VeryHard: monstres forts (25-40)
 * - Extreme: monstres très forts (40-70)
 * - Legendary: monstres ultimes (70+)
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
  if (score < 15) {
    return MonsterDifficulty.Medium;
  }
  if (score < 25) {
    return MonsterDifficulty.Hard;
  }
  if (score < 40) {
    return MonsterDifficulty.VeryHard;
  }
  if (score < 70) {
    return MonsterDifficulty.Extreme;
  }

  return MonsterDifficulty.Legendary;
}

/**
 * Retourne tous les monstres d'une difficulté donnée
 */
export function getMonstersByDifficulty(difficulty: MonsterDifficulty | string | null): ReturnType<typeof generateMob> {
  if (!difficulty) {
    return generateMob();
  }

  const mobs = generateMob();
  const filtered = mobs.filter((mob) => {
    const mobName = mob?.name?.[0];
    if (!mobName) return false;
    const mobDifficulty = getMonsterDifficulty(mobName);
    return mobDifficulty === difficulty;
  });

  // Si aucun monstre trouvé pour cette difficulté, retourner tous
  return (filtered.length > 0 ? filtered : mobs) as ReturnType<typeof generateMob>;
}
