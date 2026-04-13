import { ACHIEVEMENT_DEFINITIONS } from "../objects/data/progressionCatalog";
import { AchievementKey } from "../objects/enums/AchievementKey";
import { GameState } from "../objects/enums/GameState";
import { AchievementDefinition } from "../objects/types/AchievementDefinition";
import { AchievementOverviewItem } from "../objects/types/AchievementOverviewItem";
import { AchievementUnlockRow } from "../objects/types/AchievementUnlockRow";
import { UserRunStats } from "../objects/types/UserRunStats";
import { withPerf } from "../utils/perfLogger";
import { inferMonsterFromRunKey } from "../utils/runMonsterUtils";
import { getSupabaseAdminClient } from "../utils/supabaseClient";

export const ACHIEVEMENTS: AchievementDefinition[] = ACHIEVEMENT_DEFINITIONS;

const normalizeMonsterName = (value: string) => value.trim().toLowerCase();

const MONSTER_ACHIEVEMENT_REQUIREMENTS: ReadonlyArray<readonly [AchievementKey, string]> = [
  [AchievementKey.SlayerDragon, "Dragon"],
  [AchievementKey.SlayerHydra, "Hydra"],
  [AchievementKey.SlayerDestroyer, "Destroyer"],
  [AchievementKey.SlayerBeldia, "Beldia"],
  [AchievementKey.SlayerVanir, "Vanir"],
];

const LEVEL_ACHIEVEMENT_REQUIREMENTS: ReadonlyArray<readonly [AchievementKey, number]> = [
  [AchievementKey.Level1, 1],
  [AchievementKey.Level2, 2],
  [AchievementKey.Level3, 3],
  [AchievementKey.Level4, 4],
  [AchievementKey.Level5, 5],
  [AchievementKey.Level6, 6],
  [AchievementKey.Level7, 7],
  [AchievementKey.Level8, 8],
  [AchievementKey.Level9, 9],
  [AchievementKey.Level10, 10],
];

const GOLD_ACHIEVEMENT_REQUIREMENTS: ReadonlyArray<readonly [AchievementKey, number]> = [
  [AchievementKey.Gold250, 250],
  [AchievementKey.Gold500, 500],
  [AchievementKey.Gold750, 750],
  [AchievementKey.Gold1000, 1000],
  [AchievementKey.Gold1250, 1250],
  [AchievementKey.Gold1500, 1500],
  [AchievementKey.Gold1750, 1750],
  [AchievementKey.Gold2000, 2000],
  [AchievementKey.Gold2250, 2250],
  [AchievementKey.Gold2500, 2500],
];

const WIN_ACHIEVEMENT_REQUIREMENTS: ReadonlyArray<readonly [AchievementKey, number]> = [
  [AchievementKey.FirstWin, 1],
  [AchievementKey.TenWins, 10],
  [AchievementKey.Wins25, 25],
  [AchievementKey.Wins50, 50],
  [AchievementKey.Wins100, 100],
  [AchievementKey.Wins250, 250],
];

async function getUserRunStats(userId: string): Promise<UserRunStats> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { totalRuns: 0, winRuns: 0, winsByMonster: {} };
  }

  const { data, error } = await supabase.from("runs").select("state, monster_name, run_key").eq("user_id", userId);

  if (error) {
    console.error("[db] getUserRunStats failed:", error.message);
    return { totalRuns: 0, winRuns: 0, winsByMonster: {} };
  }

  const rows = data || [];
  const winRuns = rows.filter((row) => row.state === GameState.Good || row.state === GameState.Best).length;

  const winsByMonster: Record<string, number> = {};
  const updates: Array<{ runKey: string; monsterName: string }> = [];

  for (const row of rows) {
    const didWin = row.state === GameState.Good || row.state === GameState.Best;
    const existingMonster = row.monster_name ? String(row.monster_name) : "";
    const inferredMonster = existingMonster || inferMonsterFromRunKey(String(row.run_key || ""));

    if (!existingMonster && inferredMonster && row.run_key) {
      updates.push({
        runKey: String(row.run_key),
        monsterName: inferredMonster,
      });
    }

    if (!didWin || !inferredMonster) {
      continue;
    }

    const key = normalizeMonsterName(inferredMonster);
    winsByMonster[key] = (winsByMonster[key] ?? 0) + 1;
  }

  await Promise.all(
    updates.map(async (update) => {
      const { error: updateError } = await supabase
        .from("runs")
        .update({
          monster_name: update.monsterName,
        })
        .eq("run_key", update.runKey)
        .eq("user_id", userId)
        .is("monster_name", null);

      if (updateError) {
        console.error("[db] getUserRunStats backfill failed:", updateError.message);
      }
    }),
  );

  return {
    totalRuns: rows.length,
    winRuns,
    winsByMonster,
  };
}

export async function syncAchievements(userId: string): Promise<void> {
  return withPerf("achievementService", "syncAchievements", async () => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return;
    }

    const { data: profile, error: profileError } = await supabase.from("players").select("level, xp, gold").eq("user_id", userId).maybeSingle();

    if (profileError || !profile) {
      console.error("[db] syncAchievements profile load failed:", profileError?.message || "missing row");
      return;
    }

    const stats = await getUserRunStats(userId);
    const level = Number(profile.level || 1);
    const xp = Number(profile.xp || 0);
    const gold = Number(profile.gold || 0);

    const toUnlock: AchievementKey[] = [];
    for (const [key, requiredWins] of WIN_ACHIEVEMENT_REQUIREMENTS) {
      if (stats.winRuns >= requiredWins) {
        toUnlock.push(key);
      }
    }

    if (xp >= 100) toUnlock.push(AchievementKey.Xp100);

    for (const [key, requiredLevel] of LEVEL_ACHIEVEMENT_REQUIREMENTS) {
      if (level >= requiredLevel) {
        toUnlock.push(key);
      }
    }

    for (const [key, requiredGold] of GOLD_ACHIEVEMENT_REQUIREMENTS) {
      if (gold >= requiredGold) {
        toUnlock.push(key);
      }
    }

    for (const [key, monsterName] of MONSTER_ACHIEVEMENT_REQUIREMENTS) {
      if ((stats.winsByMonster[normalizeMonsterName(monsterName)] ?? 0) >= 1) {
        toUnlock.push(key);
      }
    }

    if (toUnlock.length === 0) {
      return;
    }

    const rows = toUnlock.map((key) => ({
      user_id: userId,
      achievement_key: key,
      unlocked_at: new Date().toISOString(),
    }));

    const { error: unlockError } = await supabase.from("achievements_unlocked").upsert(rows, { onConflict: "user_id,achievement_key" });

    if (unlockError) {
      console.error("[db] syncAchievements unlock failed:", unlockError.message);
    }
  });
}

export async function getAchievementsOverview(userId: string, fr: boolean): Promise<AchievementOverviewItem[] | null> {
  return withPerf("achievementService", "getAchievementsOverview", async () => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase.from("achievements_unlocked").select("achievement_key, unlocked_at").eq("user_id", userId);

    if (error) {
      console.error("[db] getAchievementsOverview failed:", error.message);
      return null;
    }

    const unlockedRows = (data || []) as AchievementUnlockRow[];
    const unlockedByKey = new Map(unlockedRows.map((row) => [row.achievement_key, row.unlocked_at]));

    return ACHIEVEMENTS.map((achievement) => {
      const unlockedAt = unlockedByKey.get(achievement.key) || null;
      return {
        key: achievement.key,
        title: fr ? achievement.titleFr : achievement.titleEn,
        description: fr ? achievement.descriptionFr : achievement.descriptionEn,
        unlocked: Boolean(unlockedAt),
        unlockedAt,
      };
    });
  });
}
