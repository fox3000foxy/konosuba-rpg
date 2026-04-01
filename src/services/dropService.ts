import { Random } from '../classes/Random';
import { AccessoryDefinition } from '../objects/data/accessoriesCatalog';
import { getMonsterDifficulty } from '../objects/data/monsterDifficultyMap';
import { CharacterKey } from '../objects/enums/CharacterKey';
import { ItemId } from '../objects/enums/ItemId';
import { MonsterDifficulty } from '../objects/enums/MonsterDifficulty';
import { Rarity } from '../objects/enums/Rarity';
import { TypeItem } from '../objects/enums/TypeItem';
import { getSupabaseAdminClient } from '../utils/supabaseClient';
import { getItems } from './accessoryService';
import { addCharacterAffinity } from './characterService';
import { getItems as getConsumableItems } from './consumableService';

export type AccessoryDropResult = {
  accessoryId: string;
  rarity: Rarity;
  characterKey: CharacterKey;
  affinityPoints: number;
};

export type ConsumableDropResult = {
  itemId: string;
  rarity: Rarity;
  itemType: TypeItem;
  inventoryItemType: 'potion' | 'component';
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

const CONSUMABLE_LOOT_TABLE_BY_DIFFICULTY: Record<
  MonsterDifficulty,
  LootTable
> = {
  [MonsterDifficulty.Easy]: {
    baseRolls: 1,
    bonusRollChance: 0.08,
    maxBonusRolls: 1,
    rarityWeights: [
      { rarity: Rarity.Basic, weight: 88 },
      { rarity: Rarity.Gold, weight: 11 },
      { rarity: Rarity.Epic, weight: 1 },
    ],
  },
  [MonsterDifficulty.Medium]: {
    baseRolls: 1,
    bonusRollChance: 0.16,
    maxBonusRolls: 1,
    rarityWeights: [
      { rarity: Rarity.Basic, weight: 82 },
      { rarity: Rarity.Gold, weight: 15 },
      { rarity: Rarity.Epic, weight: 3 },
    ],
  },
  [MonsterDifficulty.Hard]: {
    baseRolls: 1,
    bonusRollChance: 0.25,
    maxBonusRolls: 1,
    rarityWeights: [
      { rarity: Rarity.Basic, weight: 72 },
      { rarity: Rarity.Gold, weight: 22 },
      { rarity: Rarity.Epic, weight: 6 },
    ],
  },
  [MonsterDifficulty.VeryHard]: {
    baseRolls: 1,
    bonusRollChance: 0.34,
    maxBonusRolls: 1,
    rarityWeights: [
      { rarity: Rarity.Basic, weight: 62 },
      { rarity: Rarity.Gold, weight: 28 },
      { rarity: Rarity.Epic, weight: 10 },
    ],
  },
  [MonsterDifficulty.Extreme]: {
    baseRolls: 2,
    bonusRollChance: 0.22,
    maxBonusRolls: 1,
    rarityWeights: [
      { rarity: Rarity.Basic, weight: 54 },
      { rarity: Rarity.Gold, weight: 31 },
      { rarity: Rarity.Epic, weight: 15 },
    ],
  },
  [MonsterDifficulty.Legendary]: {
    baseRolls: 2,
    bonusRollChance: 0.42,
    maxBonusRolls: 1,
    rarityWeights: [
      { rarity: Rarity.Basic, weight: 44 },
      { rarity: Rarity.Gold, weight: 36 },
      { rarity: Rarity.Epic, weight: 20 },
    ],
  },
};

function getLootTable(difficulty: MonsterDifficulty): LootTable {
  return (
    LOOT_TABLE_BY_DIFFICULTY[difficulty] ||
    LOOT_TABLE_BY_DIFFICULTY[MonsterDifficulty.Medium]
  );
}

function getConsumableLootTable(difficulty: MonsterDifficulty): LootTable {
  return (
    CONSUMABLE_LOOT_TABLE_BY_DIFFICULTY[difficulty] ||
    CONSUMABLE_LOOT_TABLE_BY_DIFFICULTY[MonsterDifficulty.Medium]
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

function computeConsumableDropCount(
  rand: Random,
  lootTable: LootTable
): number {
  let count = lootTable.baseRolls;

  for (let i = 0; i < lootTable.maxBonusRolls; i += 1) {
    if (rand.next() < lootTable.bonusRollChance) {
      count += 1;
    }
  }

  return Math.min(3, Math.max(1, count));
}

function pickAccessoryByRarity(
  rarity: Rarity,
  rand: Random
): AccessoryDefinition {
  const byRarity = getItems({ rarity });
  const pool = byRarity.length > 0 ? byRarity : getItems();
  return rand.choice(pool);
}

function pickConsumableByRarity(rarity: Rarity, rand: Random): ItemId {
  const byRarity = getConsumableItems({ rarity }).map(item => item.id);
  const pool =
    byRarity.length > 0 ? byRarity : getConsumableItems().map(item => item.id);
  return rand.choice(pool) as ItemId;
}

function inventoryTypeForConsumableType(
  type: TypeItem
): 'potion' | 'component' {
  return type === TypeItem.Potion ? 'potion' : 'component';
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

export function rollConsumableDrop(
  runKey: string,
  monsterName?: string | null
): ConsumableDropResult[] {
  const rand = new Random(seedFromRunKey(`${runKey}:consumable`));
  const difficulty = getMonsterDifficulty(monsterName ?? null);
  const lootTable = getConsumableLootTable(difficulty);
  const dropCount = computeConsumableDropCount(rand, lootTable);
  const drops: ConsumableDropResult[] = [];

  for (let i = 0; i < dropCount; i += 1) {
    const rarity = pickWeightedRarity(rand, lootTable.rarityWeights);
    const itemId = pickConsumableByRarity(rarity, rand);
    const item = getConsumableItems({ id: itemId, limit: 1 })[0];
    if (!item) {
      continue;
    }

    drops.push({
      itemId,
      rarity: item.rarity,
      itemType: item.type,
      inventoryItemType: inventoryTypeForConsumableType(item.type),
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

export async function grantConsumableDropRewards(
  userId: string,
  runKey: string,
  monsterName?: string | null
): Promise<ConsumableDropResult[] | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const drops = rollConsumableDrop(runKey, monsterName);

  for (const drop of drops) {
    const { data: current, error: loadError } = await supabase
      .from('inventory_items')
      .select('quantity')
      .eq('user_id', userId)
      .eq('item_key', drop.itemId)
      .maybeSingle();

    if (loadError) {
      console.error(
        '[db] load inventory item for consumable drop failed:',
        loadError.message
      );
      return null;
    }

    if (!current) {
      const { error: insertError } = await supabase
        .from('inventory_items')
        .insert({
          user_id: userId,
          item_key: drop.itemId,
          item_type: drop.inventoryItemType,
          quantity: 1,
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(
          '[db] insert dropped consumable failed:',
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
        .eq('item_key', drop.itemId);

      if (updateError) {
        console.error(
          '[db] update dropped consumable quantity failed:',
          updateError.message
        );
        return null;
      }
    }
  }

  return drops;
}
