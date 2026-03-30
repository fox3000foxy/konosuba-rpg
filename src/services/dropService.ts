import { Random } from '../classes/Random';
import { AccessoryDefinition } from '../objects/data/accessoriesCatalog';
import { getMonsterDifficulty } from '../objects/data/monsterDifficultyMap';
import { CharacterKey } from '../objects/enums/CharacterKey';
import { MonsterDifficulty } from '../objects/enums/MonsterDifficulty';
import { Rarity } from '../objects/enums/Rarity';
import { getSupabaseAdminClient } from '../utils/supabaseClient';
import { getItems } from './accessoryService';
import {
  addCharacterAffinity,
  ensureCharacterProgress,
} from './characterService';

export type AccessoryDropResult = {
  accessoryId: string;
  rarity: Rarity;
  characterKey: CharacterKey;
  affinityPoints: number;
};

type LootRarityWeight = {
  rarity: Rarity;
  weight: number;
};

type LootTable = {
  baseRolls: number;
  bonusRollChance: number;
  maxBonusRolls: number;
  rarityWeights: LootRarityWeight[];
};

const DROP_CHARACTERS: CharacterKey[] = [
  CharacterKey.Darkness,
  CharacterKey.Megumin,
  CharacterKey.Aqua,
];

export const ACCESSORY_AFFINITY_POINTS_BY_RARITY: Record<Rarity, number> = {
  [Rarity.Bronze]: 3,
  [Rarity.Silver]: 5,
  [Rarity.Basic]: 4,
  [Rarity.Gold]: 8,
  [Rarity.Epic]: 12,
};

const LOOT_TABLE_BY_DIFFICULTY: Record<MonsterDifficulty, LootTable> = {
  [MonsterDifficulty.Easy]: {
    baseRolls: 2,
    bonusRollChance: 0.1,
    maxBonusRolls: 2,
    rarityWeights: [
      { rarity: Rarity.Bronze, weight: 68 },
      { rarity: Rarity.Silver, weight: 25 },
      { rarity: Rarity.Gold, weight: 6 },
      { rarity: Rarity.Epic, weight: 1 },
    ],
  },
  [MonsterDifficulty.Medium]: {
    baseRolls: 2,
    bonusRollChance: 0.2,
    maxBonusRolls: 2,
    rarityWeights: [
      { rarity: Rarity.Bronze, weight: 58 },
      { rarity: Rarity.Silver, weight: 29 },
      { rarity: Rarity.Gold, weight: 10 },
      { rarity: Rarity.Epic, weight: 3 },
    ],
  },
  [MonsterDifficulty.Hard]: {
    baseRolls: 2,
    bonusRollChance: 0.45,
    maxBonusRolls: 2,
    rarityWeights: [
      { rarity: Rarity.Bronze, weight: 40 },
      { rarity: Rarity.Silver, weight: 34 },
      { rarity: Rarity.Gold, weight: 20 },
      { rarity: Rarity.Epic, weight: 6 },
    ],
  },
  [MonsterDifficulty.VeryHard]: {
    baseRolls: 2,
    bonusRollChance: 0.65,
    maxBonusRolls: 2,
    rarityWeights: [
      { rarity: Rarity.Bronze, weight: 29 },
      { rarity: Rarity.Silver, weight: 34 },
      { rarity: Rarity.Gold, weight: 27 },
      { rarity: Rarity.Epic, weight: 10 },
    ],
  },
  [MonsterDifficulty.Extreme]: {
    baseRolls: 3,
    bonusRollChance: 0.7,
    maxBonusRolls: 1,
    rarityWeights: [
      { rarity: Rarity.Bronze, weight: 20 },
      { rarity: Rarity.Silver, weight: 31 },
      { rarity: Rarity.Gold, weight: 34 },
      { rarity: Rarity.Epic, weight: 15 },
    ],
  },
  [MonsterDifficulty.Legendary]: {
    baseRolls: 3,
    bonusRollChance: 0.9,
    maxBonusRolls: 1,
    rarityWeights: [
      { rarity: Rarity.Bronze, weight: 8 },
      { rarity: Rarity.Silver, weight: 24 },
      { rarity: Rarity.Gold, weight: 43 },
      { rarity: Rarity.Epic, weight: 25 },
    ],
  },
};

function getLootTable(difficulty: MonsterDifficulty): LootTable {
  return (
    LOOT_TABLE_BY_DIFFICULTY[difficulty] ||
    LOOT_TABLE_BY_DIFFICULTY[MonsterDifficulty.Medium]
  );
}

function seedFromRunKey(runKey: string): number {
  let seed = 0;
  for (let i = 0; i < runKey.length; i += 1) {
    seed = (seed * 31 + runKey.charCodeAt(i)) % 2147483647;
  }

  return seed;
}

function pickWeightedRarity(rand: Random, weights: LootRarityWeight[]): Rarity {
  const totalWeight = weights.reduce((acc, row) => acc + row.weight, 0);
  let roll = rand.next() * totalWeight;

  for (const row of weights) {
    roll -= row.weight;
    if (roll <= 0) {
      return row.rarity;
    }
  }

  return Rarity.Bronze;
}

function computeDropCount(rand: Random, lootTable: LootTable): number {
  let count = lootTable.baseRolls;

  for (let i = 0; i < lootTable.maxBonusRolls; i += 1) {
    if (rand.next() < lootTable.bonusRollChance) {
      count += 1;
    }
  }

  return Math.min(4, Math.max(2, count));
}

function pickAccessoryByRarity(
  rarity: Rarity,
  rand: Random
): AccessoryDefinition {
  const byRarity = getItems({ rarity });
  const pool = byRarity.length > 0 ? byRarity : getItems();
  return rand.choice(pool);
}

export function rollAccessoryDrop(
  runKey: string,
  monsterName?: string | null
): AccessoryDropResult[] {
  const rand = new Random(seedFromRunKey(runKey));
  const difficulty = getMonsterDifficulty(monsterName ?? null);
  const lootTable = getLootTable(difficulty);
  const dropCount = computeDropCount(rand, lootTable);
  const drops: AccessoryDropResult[] = [];

  for (let i = 0; i < dropCount; i += 1) {
    const rarity = pickWeightedRarity(rand, lootTable.rarityWeights);
    const item = pickAccessoryByRarity(rarity, rand);
    const characterKey = rand.choice(DROP_CHARACTERS);

    drops.push({
      accessoryId: item.id,
      rarity: item.rarity,
      characterKey,
      affinityPoints: ACCESSORY_AFFINITY_POINTS_BY_RARITY[item.rarity],
    });
  }

  return drops;
}

export async function grantAccessoryDropRewards(
  userId: string,
  runKey: string,
  monsterName?: string | null
): Promise<AccessoryDropResult[] | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const drops = rollAccessoryDrop(runKey, monsterName);
  await ensureCharacterProgress(userId);

  for (const drop of drops) {
    const { data: current, error: loadError } = await supabase
      .from('inventory_items')
      .select('quantity')
      .eq('user_id', userId)
      .eq('item_key', drop.accessoryId)
      .maybeSingle();

    if (loadError) {
      console.error(
        '[db] load inventory item for drop failed:',
        loadError.message
      );
      return null;
    }

    if (!current) {
      const { error: insertError } = await supabase
        .from('inventory_items')
        .insert({
          user_id: userId,
          item_key: drop.accessoryId,
          item_type: 'affinity',
          quantity: 1,
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(
          '[db] insert dropped accessory failed:',
          insertError.message
        );
        return null;
      }
    } else {
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          quantity: Number(current.quantity || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('item_key', drop.accessoryId);

      if (updateError) {
        console.error(
          '[db] update dropped accessory quantity failed:',
          updateError.message
        );
        return null;
      }
    }

    await addCharacterAffinity(userId, drop.characterKey, drop.affinityPoints);
  }

  return drops;
}
