import { generateMob } from '../src/objects/data/mobMap';
import { getMonsterDifficulty } from '../src/objects/data/monsterDifficultyMap';
import { MonsterDifficulty } from '../src/objects/enums/MonsterDifficulty';

interface MonsterStats {
  hpMax: number;
  attackMin: number;
  attackMax: number;
}

function calculateDifficultyScore(stats: MonsterStats): number {
  const hpScore = stats.hpMax / 100;
  const attackScore = (stats.attackMin + stats.attackMax) / 2;
  return hpScore + attackScore;
}

function main() {
  const mobs = generateMob();
  
  const monsters = mobs.map(mob => {
    const stats: MonsterStats = {
      hpMax: mob.hpMax,
      attackMin: mob.attack[0],
      attackMax: mob.attack[1],
    };
    const score = calculateDifficultyScore(stats);
    const difficulty = getMonsterDifficulty(mob.name[0]);
    
    return {
      name: mob.name[0],
      hp: mob.hpMax,
      atkMin: mob.attack[0],
      atkMax: mob.attack[1],
      score: score.toFixed(2),
      difficulty,
    };
  });

  // Sort by score
  monsters.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));

  console.log('\n📊 MONSTER DIFFICULTY SCORES\n');
  console.log('NAME'.padEnd(25) + 'HP'.padEnd(8) + 'ATK'.padEnd(15) + 'SCORE'.padEnd(10) + 'DIFFICULTY');
  console.log('─'.repeat(80));

  const difficultyGroups: Record<MonsterDifficulty, typeof monsters> = {
    [MonsterDifficulty.Easy]: [],
    [MonsterDifficulty.Medium]: [],
    [MonsterDifficulty.Hard]: [],
    [MonsterDifficulty.VeryHard]: [],
    [MonsterDifficulty.Extreme]: [],
    [MonsterDifficulty.Legendary]: [],
  };

  for (const monster of monsters) {
    const colors: Record<MonsterDifficulty, string> = {
      [MonsterDifficulty.Easy]: '\x1b[32m', // Green
      [MonsterDifficulty.Medium]: '\x1b[33m', // Yellow
      [MonsterDifficulty.Hard]: '\x1b[31m', // Red
      [MonsterDifficulty.VeryHard]: '\x1b[35m', // Magenta
      [MonsterDifficulty.Extreme]: '\x1b[36m', // Cyan
      [MonsterDifficulty.Legendary]: '\x1b[1;33m', // Bold Yellow
    };

    const reset = '\x1b[0m';
    const color = colors[monster.difficulty as MonsterDifficulty];
    
    console.log(
      color +
      monster.name.padEnd(25) +
      monster.hp.toString().padEnd(8) +
      `${monster.atkMin}-${monster.atkMax}`.padEnd(15) +
      monster.score.toString().padEnd(10) +
      monster.difficulty +
      reset
    );
    
    difficultyGroups[monster.difficulty as MonsterDifficulty].push(monster);
  }

  console.log('\n' + '─'.repeat(80));
  console.log('\n📈 SUMMARY BY DIFFICULTY\n');

  for (const difficulty of Object.values(MonsterDifficulty)) {
    const group = difficultyGroups[difficulty as MonsterDifficulty];
    if (group.length > 0) {
      const scores = group.map(m => parseFloat(m.score));
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
      
      console.log(`${difficulty.toUpperCase().padEnd(15)} (${group.length} monsters)`);
      console.log(`  Range: ${minScore.toFixed(2)} - ${maxScore.toFixed(2)}`);
      console.log(`  Avg: ${avgScore}`);
      console.log(`  Monsters: ${group.map(m => m.name).join(', ')}\n`);
    }
  }
}

main();
