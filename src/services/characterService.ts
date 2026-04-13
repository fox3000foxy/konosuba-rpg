import { CharacterKey } from "../objects/enums/CharacterKey";
import type { CharacterProgress } from "../objects/types/CharacterProgress";
import type { CharacterStatsSnapshot } from "../objects/types/CharacterStatsSnapshot";
import { withPerf } from "../utils/perfLogger";
import { getSupabaseAdminClient } from "../utils/supabaseClient";
import { ensurePlayerProfile } from "./playerService";

const CHARACTER_KEYS: CharacterKey[] = [CharacterKey.Darkness, CharacterKey.Aqua, CharacterKey.Megumin];

const clampLevel = (level: number) => Math.max(1, level);
const AFFINITY_POINTS_PER_STAR = 20;
const MAX_AFFINITY_STARS = 5;
const STAR_FACTOR = 1.2;

export function computeLevelFromXp(xp: number): number {
  return clampLevel(Math.floor(Math.max(0, xp) / 100) + 1);
}

export function getLevelFactor(level: number): number {
  return 1 + 0.2 * (clampLevel(level) - 1);
}

export function getAffinityStars(affinity: number): number {
  const safeAffinity = Math.max(0, affinity);
  const stars = Math.floor(safeAffinity / AFFINITY_POINTS_PER_STAR);
  return Math.max(0, Math.min(MAX_AFFINITY_STARS, stars));
}

export function getAffinityFactor(affinity: number): number {
  return STAR_FACTOR ** getAffinityStars(affinity);
}

export async function ensureCharacterProgress(userId: string): Promise<void> {
  await withPerf("characterService", "ensureCharacterProgress", async () => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return;
    }

    // Ensure FK target exists before inserting character_progress rows.
    await ensurePlayerProfile(userId);

    const { data: existingRows, error: loadError } = await supabase.from("character_progress").select("character_key").eq("user_id", userId);

    if (loadError) {
      console.error("[db] ensureCharacterProgress load failed:", loadError.message);
      return;
    }

    const existingKeys = new Set((existingRows || []).map((row) => String(row.character_key) as CharacterKey));

    const missingRows = CHARACTER_KEYS.filter((characterKey) => !existingKeys.has(characterKey)).map((characterKey) => ({
      user_id: userId,
      character_key: characterKey,
      xp: 0,
      level: 1,
      affinity: 0,
      updated_at: new Date().toISOString(),
    }));

    if (missingRows.length === 0) {
      return;
    }

    const { error } = await supabase.from("character_progress").insert(missingRows);

    if (error) {
      console.error("[db] ensureCharacterProgress failed:", error.message);
    }
  });
}

export async function getCharacterProgress(userId: string, characterKey: CharacterKey): Promise<CharacterProgress | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("character_progress").select("user_id, character_key, xp, level, affinity").eq("user_id", userId).eq("character_key", characterKey).maybeSingle();

  if (error) {
    console.error("[db] getCharacterProgress failed:", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    userId: String(data.user_id),
    characterKey: String(data.character_key) as CharacterKey,
    xp: Number(data.xp || 0),
    level: Number(data.level || 1),
    affinity: Number(data.affinity || 0),
  };
}

export async function getCharacterProgresses(userId: string): Promise<CharacterProgress[] | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("character_progress").select("user_id, character_key, xp, level, affinity").eq("user_id", userId);

  if (error) {
    console.error("[db] getCharacterProgresses failed:", error.message);
    return null;
  }

  const byKey = new Map((data || []).map((row) => [String(row.character_key) as CharacterKey, row]));

  return CHARACTER_KEYS.map((characterKey) => {
    const row = byKey.get(characterKey);
    return {
      userId,
      characterKey,
      xp: Number(row?.xp || 0),
      level: Number(row?.level || 1),
      affinity: Number(row?.affinity || 0),
    };
  });
}

type CharacterMutationOptions = {
  ensureProfile?: boolean;
};

export async function addCharacterXp(userId: string, characterKey: CharacterKey, amount: number, options?: CharacterMutationOptions): Promise<void> {
  if (amount <= 0) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  if (options?.ensureProfile !== false) {
    await ensurePlayerProfile(userId);
  }

  const current = await getCharacterProgress(userId, characterKey);
  if (!current) {
    const initialXp = amount;
    const initialLevel = computeLevelFromXp(initialXp);

    const { error: insertError } = await supabase.from("character_progress").insert({
      user_id: userId,
      character_key: characterKey,
      xp: initialXp,
      level: initialLevel,
      affinity: 0,
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[db] addCharacterXp insert failed:", insertError.message);
    }
    return;
  }

  const currentXp = Number(current?.xp || 0);
  const nextXp = currentXp + amount;
  const nextLevel = computeLevelFromXp(nextXp);

  const { data: updatedRow, error } = await supabase
    .from("character_progress")
    .update({
      xp: nextXp,
      level: nextLevel,
    })
    .eq("user_id", userId)
    .eq("character_key", characterKey)
    .select("user_id")
    .maybeSingle();

  if (error) {
    console.error("[db] addCharacterXp failed:", error.message);
    return;
  }

  if (!updatedRow) {
    console.error(`[db] addCharacterXp updated no rows: user=${userId} character=${characterKey}`);
  }
}

export async function addCharacterAffinity(userId: string, characterKey: CharacterKey, amount: number, options?: CharacterMutationOptions): Promise<void> {
  if (amount <= 0) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  if (options?.ensureProfile !== false) {
    await ensurePlayerProfile(userId);
  }

  const current = await getCharacterProgress(userId, characterKey);
  if (!current) {
    const { error: insertError } = await supabase.from("character_progress").insert({
      user_id: userId,
      character_key: characterKey,
      xp: 0,
      level: 1,
      affinity: amount,
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[db] addCharacterAffinity insert failed:", insertError.message);
    }
    return;
  }

  const nextAffinity = Number(current?.affinity || 0) + amount;

  const { data: updatedRow, error } = await supabase
    .from("character_progress")
    .update({
      affinity: nextAffinity,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("character_key", characterKey)
    .select("user_id")
    .maybeSingle();

  if (error) {
    console.error("[db] addCharacterAffinity failed:", error.message);
    return;
  }

  if (!updatedRow) {
    console.error(`[db] addCharacterAffinity updated no rows: user=${userId} character=${characterKey}`);
  }
}

export async function getCharacterStatsSnapshot(userId: string): Promise<CharacterStatsSnapshot[] | null> {
  return withPerf("characterService", "getCharacterStatsSnapshot", async () => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return null;
    }

    const { data: playerRow, error: playerError } = await supabase.from("players").select("level").eq("user_id", userId).maybeSingle();

    if (playerError) {
      console.error("[db] getCharacterStatsSnapshot player load failed:", playerError.message);
      return null;
    }

    const kazumaLevel = Number(playerRow?.level || 1);
    const progresses = await getCharacterProgresses(userId);
    if (!progresses) {
      return null;
    }

    const byKey = new Map(progresses.map((progress) => [progress.characterKey, progress]));

    return [
      {
        characterKey: "kazuma",
        level: clampLevel(kazumaLevel),
        factor: getLevelFactor(kazumaLevel),
      },
      {
        characterKey: CharacterKey.Darkness,
        level: Number(byKey.get(CharacterKey.Darkness)?.level || 1),
        factor: getLevelFactor(Number(byKey.get(CharacterKey.Darkness)?.level || 1)) * getAffinityFactor(Number(byKey.get(CharacterKey.Darkness)?.affinity || 0)),
      },
      {
        characterKey: CharacterKey.Megumin,
        level: Number(byKey.get(CharacterKey.Megumin)?.level || 1),
        factor: getLevelFactor(Number(byKey.get(CharacterKey.Megumin)?.level || 1)) * getAffinityFactor(Number(byKey.get(CharacterKey.Megumin)?.affinity || 0)),
      },
      {
        characterKey: CharacterKey.Aqua,
        level: Number(byKey.get(CharacterKey.Aqua)?.level || 1),
        factor: getLevelFactor(Number(byKey.get(CharacterKey.Aqua)?.level || 1)) * getAffinityFactor(Number(byKey.get(CharacterKey.Aqua)?.affinity || 0)),
      },
    ];
  });
}
