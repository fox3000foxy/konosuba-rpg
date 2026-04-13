import { Random } from "../classes/Random";
import { getMonsterDifficulty } from "../objects/data/monsterDifficultyMap";
import { CharacterKey } from "../objects/enums/CharacterKey";
import type { ItemId } from "../objects/enums/ItemId";
import { MonsterDifficulty } from "../objects/enums/MonsterDifficulty";
import { Rarity } from "../objects/enums/Rarity";
import { TypeItem } from "../objects/enums/TypeItem";
import type { AccessoryDefinition } from "../objects/types/catalog/Accessory";
import { withPerf } from "../utils/perfLogger";
import { getSupabaseAdminClient } from "../utils/supabaseClient";
import { getItems } from "./accessoryService";
import { addCharacterAffinity } from "./characterService";
import { getItems as getConsumableItems } from "./consumableService";
import type { AccessoryDropResult, ConsumableDropResult } from "./types/drop";

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

type InventoryRow = {
  item_key: string;
  quantity: number | null;
};

const DROP_CHARACTERS: CharacterKey[] = [CharacterKey.Darkness, CharacterKey.Megumin, CharacterKey.Aqua];

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

const CONSUMABLE_LOOT_TABLE_BY_DIFFICULTY: Record<MonsterDifficulty, LootTable> = {
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
  return LOOT_TABLE_BY_DIFFICULTY[difficulty] || LOOT_TABLE_BY_DIFFICULTY[MonsterDifficulty.Medium];
}

function getConsumableLootTable(difficulty: MonsterDifficulty): LootTable {
  return CONSUMABLE_LOOT_TABLE_BY_DIFFICULTY[difficulty] || CONSUMABLE_LOOT_TABLE_BY_DIFFICULTY[MonsterDifficulty.Medium];
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

function computeConsumableDropCount(rand: Random, lootTable: LootTable): number {
  let count = lootTable.baseRolls;

  for (let i = 0; i < lootTable.maxBonusRolls; i += 1) {
    if (rand.next() < lootTable.bonusRollChance) {
      count += 1;
    }
  }

  return Math.min(3, Math.max(1, count));
}

function pickAccessoryByRarity(rarity: Rarity, rand: Random): AccessoryDefinition {
  const byRarity = getItems({ rarity });
  const pool = byRarity.length > 0 ? byRarity : getItems();
  return rand.choice(pool);
}

function pickConsumableByRarity(rarity: Rarity, rand: Random): ItemId {
  const byRarity = getConsumableItems({ rarity }).map((item) => item.id);
  const pool = byRarity.length > 0 ? byRarity : getConsumableItems().map((item) => item.id);
  return rand.choice(pool) as ItemId;
}

function inventoryTypeForConsumableType(type: TypeItem): "potion" | "component" {
  return type === TypeItem.Potion ? "potion" : "component";
}

export function rollAccessoryDrop(runKey: string, monsterName?: string | null): AccessoryDropResult[] {
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

export function rollConsumableDrop(runKey: string, monsterName?: string | null): ConsumableDropResult[] {
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

export async function grantAccessoryDropRewards(userId: string, runKey: string, monsterName?: string | null): Promise<AccessoryDropResult[] | null> {
  return withPerf("dropService", "grantAccessoryDropRewards", async () => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return null;
    }

    const drops = rollAccessoryDrop(runKey, monsterName);
    if (drops.length === 0) {
      return drops;
    }

    const countsByItem = new Map<string, number>();
    const affinityByCharacter = new Map<CharacterKey, number>();
    for (const drop of drops) {
      countsByItem.set(drop.accessoryId, (countsByItem.get(drop.accessoryId) || 0) + 1);
      affinityByCharacter.set(drop.characterKey, (affinityByCharacter.get(drop.characterKey) || 0) + drop.affinityPoints);
    }

    const itemKeys = [...countsByItem.keys()];
    const { data: existingRows, error: loadError } = await supabase.from("inventory_items").select("item_key, quantity").eq("user_id", userId).in("item_key", itemKeys);

    if (loadError) {
      console.error("[db] load inventory item for drop failed:", loadError.message);
      return null;
    }

    const nowIso = new Date().toISOString();
    const existingByItemKey = new Map(((existingRows || []) as InventoryRow[]).map((row) => [String(row.item_key), Number(row.quantity || 0)]));

    const rowsToInsert: Array<{
      user_id: string;
      item_key: string;
      item_type: string;
      quantity: number;
      updated_at: string;
    }> = [];

    const updateOps: Array<PromiseLike<{ error: { message: string } | null }>> = [];

    for (const [itemKey, increment] of countsByItem.entries()) {
      const currentQuantity = existingByItemKey.get(itemKey);
      if (typeof currentQuantity !== "number") {
        rowsToInsert.push({
          user_id: userId,
          item_key: itemKey,
          item_type: "affinity",
          quantity: increment,
          updated_at: nowIso,
        });
        continue;
      }

      updateOps.push(
        supabase
          .from("inventory_items")
          .update({
            quantity: currentQuantity + increment,
            updated_at: nowIso,
          })
          .eq("user_id", userId)
          .eq("item_key", itemKey),
      );
    }

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("inventory_items").insert(rowsToInsert);
      if (insertError) {
        console.error("[db] insert dropped accessory failed:", insertError.message);
        return null;
      }
    }

    if (updateOps.length > 0) {
      const updateResults = await Promise.all(updateOps);
      for (const result of updateResults) {
        if (result.error) {
          console.error("[db] update dropped accessory quantity failed:", result.error.message);
          return null;
        }
      }
    }

    await Promise.all([...affinityByCharacter.entries()].map(([characterKey, totalAffinity]) => addCharacterAffinity(userId, characterKey, totalAffinity, { ensureProfile: false })));

    return drops;
  });
}

export async function grantConsumableDropRewards(userId: string, runKey: string, monsterName?: string | null): Promise<ConsumableDropResult[] | null> {
  return withPerf("dropService", "grantConsumableDropRewards", async () => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return null;
    }

    const drops = rollConsumableDrop(runKey, monsterName);
    if (drops.length === 0) {
      return drops;
    }

    const groupedByItem = new Map<string, { itemType: string; quantity: number }>();
    for (const drop of drops) {
      const current = groupedByItem.get(drop.itemId);
      if (current) {
        current.quantity += 1;
      } else {
        groupedByItem.set(drop.itemId, {
          itemType: drop.inventoryItemType,
          quantity: 1,
        });
      }
    }

    const itemKeys = [...groupedByItem.keys()];
    const { data: existingRows, error: loadError } = await supabase.from("inventory_items").select("item_key, quantity").eq("user_id", userId).in("item_key", itemKeys);

    if (loadError) {
      console.error("[db] load inventory item for consumable drop failed:", loadError.message);
      return null;
    }

    const nowIso = new Date().toISOString();
    const existingByItemKey = new Map(((existingRows || []) as InventoryRow[]).map((row) => [String(row.item_key), Number(row.quantity || 0)]));

    const rowsToInsert: Array<{
      user_id: string;
      item_key: string;
      item_type: string;
      quantity: number;
      updated_at: string;
    }> = [];

    const updateOps: Array<PromiseLike<{ error: { message: string } | null }>> = [];

    for (const [itemKey, grouped] of groupedByItem.entries()) {
      const currentQuantity = existingByItemKey.get(itemKey);
      if (typeof currentQuantity !== "number") {
        rowsToInsert.push({
          user_id: userId,
          item_key: itemKey,
          item_type: grouped.itemType,
          quantity: grouped.quantity,
          updated_at: nowIso,
        });
        continue;
      }

      updateOps.push(
        supabase
          .from("inventory_items")
          .update({
            quantity: currentQuantity + grouped.quantity,
            updated_at: nowIso,
          })
          .eq("user_id", userId)
          .eq("item_key", itemKey),
      );
    }

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("inventory_items").insert(rowsToInsert);

      if (insertError) {
        console.error("[db] insert dropped consumable failed:", insertError.message);
        return null;
      }
    }

    if (updateOps.length > 0) {
      const updateResults = await Promise.all(updateOps);
      for (const result of updateResults) {
        if (result.error) {
          console.error("[db] update dropped consumable quantity failed:", result.error.message);
          return null;
        }
      }
    }

    return drops;
  });
}
