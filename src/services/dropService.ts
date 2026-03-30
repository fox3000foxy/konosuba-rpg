import { Random } from '../classes/Random';
import { AccessoryDefinition } from '../objects/data/accessoriesCatalog';
import { getMonsterDifficulty } from '../objects/data/monsterDifficultyMap';
import { CharacterKey } from '../objects/enums/CharacterKey';
import { MonsterDifficulty } from '../objects/enums/MonsterDifficulty';
import { Rarity } from '../objects/enums/Rarity';
import { getSupabaseAdminClient } from '../utils/supabaseClient';
import { getItems } from './accessoryService';
import { addCharacterAffinity, ensureCharacterProgress } from './characterService';

export type AccessoryDropResult = {
  accessoryId: string;
  rarity: Rarity;
  characterKey: CharacterKey;
  affinityPoints: number;
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

const BASE_ACCESSORY_RARITY_WEIGHTS: Array<{ rarity: Rarity; weight: number }> = [
  { rarity: Rarity.Bronze, weight: 55 },
  { rarity: Rarity.Silver, weight: 30 },
  { rarity: Rarity.Gold, weight: 12 },
  { rarity: Rarity.Epic, weight: 3 },
];

/**
 * Ajuste les poids de rareté en fonction de la difficulté du monstre
 */
function getAccessoryRarityWeights(
  difficulty: MonsterDifficulty
): Array<{ rarity: Rarity; weight: number }> {
  // Copier les poids de base
  const weights = BASE_ACCESSORY_RARITY_WEIGHTS.map(w => ({ ...w }));

  // Modifier les poids selon la difficulté
  switch (difficulty) {
    case MonsterDifficulty.Easy:
      // Pas de changement
      break;

    case MonsterDifficulty.Medium:
      // Légère augmentation des Silver et Gold
      weights.find(w => w.rarity === Rarity.Bronze)!.weight = 50;
      weights.find(w => w.rarity === Rarity.Silver)!.weight = 35;
      weights.find(w => w.rarity === Rarity.Gold)!.weight = 13;
      weights.find(w => w.rarity === Rarity.Epic)!.weight = 2;
      break;

    case MonsterDifficulty.Hard:
      // Plus de chances de rares
      weights.find(w => w.rarity === Rarity.Bronze)!.weight = 40;
      weights.find(w => w.rarity === Rarity.Silver)!.weight = 35;
      weights.find(w => w.rarity === Rarity.Gold)!.weight = 20;
      weights.find(w => w.rarity === Rarity.Epic)!.weight = 5;
      break;

    case MonsterDifficulty.VeryHard:
      // Bien plus de chances de rares
      weights.find(w => w.rarity === Rarity.Bronze)!.weight = 30;
      weights.find(w => w.rarity === Rarity.Silver)!.weight = 30;
      weights.find(w => w.rarity === Rarity.Gold)!.weight = 30;
      weights.find(w => w.rarity === Rarity.Epic)!.weight = 10;
      break;

    case MonsterDifficulty.Extreme:
      // Très hauts taux de rares
      weights.find(w => w.rarity === Rarity.Bronze)!.weight = 20;
      weights.find(w => w.rarity === Rarity.Silver)!.weight = 25;
      weights.find(w => w.rarity === Rarity.Gold)!.weight = 40;
      weights.find(w => w.rarity === Rarity.Epic)!.weight = 15;
      break;

    case MonsterDifficulty.Legendary:
      // Quasi-garantie de Gold/Epic
      weights.find(w => w.rarity === Rarity.Bronze)!.weight = 5;
      weights.find(w => w.rarity === Rarity.Silver)!.weight = 15;
      weights.find(w => w.rarity === Rarity.Gold)!.weight = 50;
      weights.find(w => w.rarity === Rarity.Epic)!.weight = 30;
      break;
  }

  return weights;
}

function seedFromRunKey(runKey: string): number {
  let seed = 0;
  for (let i = 0; i < runKey.length; i += 1) {
    seed = (seed * 31 + runKey.charCodeAt(i)) % 2147483647;
  }

  return seed;
}

function pickWeightedRarity(rand: Random, difficulty: MonsterDifficulty): Rarity {
  const weights = getAccessoryRarityWeights(difficulty);
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

function pickAccessoryByRarity(rarity: Rarity, rand: Random): AccessoryDefinition {
  const byRarity = getItems({ rarity });
  const pool = byRarity.length > 0 ? byRarity : getItems();
  return rand.choice(pool);
}

export function rollAccessoryDrop(runKey: string, monsterName?: string | null): AccessoryDropResult {
  const rand = new Random(seedFromRunKey(runKey));
  const difficulty = getMonsterDifficulty(monsterName ?? null);
  const rarity = pickWeightedRarity(rand, difficulty);
  const item = pickAccessoryByRarity(rarity, rand);
  const characterKey = rand.choice(DROP_CHARACTERS);

  return {
    accessoryId: item.id,
    rarity: item.rarity,
    characterKey,
    affinityPoints: ACCESSORY_AFFINITY_POINTS_BY_RARITY[item.rarity],
  };
}

export async function grantAccessoryDropRewards(
  userId: string,
  runKey: string,
  monsterName?: string | null
): Promise<AccessoryDropResult | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const drop = rollAccessoryDrop(runKey, monsterName);
  await ensureCharacterProgress(userId);

  const { data: current, error: loadError } = await supabase
    .from('inventory_items')
    .select('quantity')
    .eq('user_id', userId)
    .eq('item_key', drop.accessoryId)
    .maybeSingle();

  if (loadError) {
    console.error('[db] load inventory item for drop failed:', loadError.message);
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
      console.error('[db] insert dropped accessory failed:', insertError.message);
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
      console.error('[db] update dropped accessory quantity failed:', updateError.message);
      return null;
    }
  }

  await addCharacterAffinity(userId, drop.characterKey, drop.affinityPoints);

  return drop;
}
