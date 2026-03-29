import { AchievementKey } from '../objects/enums/AchievementKey';
import { GameState } from '../objects/enums/GameState';
import { AchievementDefinition } from '../objects/types/AchievementDefinition';
import { AchievementOverviewItem } from '../objects/types/AchievementOverviewItem';
import { AchievementUnlockRow } from '../objects/types/AchievementUnlockRow';
import { UserRunStats } from '../objects/types/UserRunStats';
import { getSupabaseAdminClient } from '../utils/supabaseClient';

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    key: AchievementKey.FirstWin,
    titleFr: 'Premiere victoire',
    titleEn: 'First victory',
    descriptionFr: 'Gagner 1 combat',
    descriptionEn: 'Win 1 battle',
  },
  {
    key: AchievementKey.TenWins,
    titleFr: 'Chasseur confirme',
    titleEn: 'Seasoned hunter',
    descriptionFr: 'Gagner 10 combats',
    descriptionEn: 'Win 10 battles',
  },
  {
    key: AchievementKey.Xp100,
    titleFr: 'Aventurier niveau 2',
    titleEn: 'Adventurer level 2',
    descriptionFr: 'Atteindre 100 XP',
    descriptionEn: 'Reach 100 XP',
  },
  {
    key: AchievementKey.Gold250,
    titleFr: 'Bourse pleine',
    titleEn: 'Heavy purse',
    descriptionFr: 'Atteindre 250 or',
    descriptionEn: 'Reach 250 gold',
  },
];

async function getUserRunStats(userId: string): Promise<UserRunStats> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { totalRuns: 0, winRuns: 0 };
  }

  const { data, error } = await supabase
    .from('runs')
    .select('state')
    .eq('user_id', userId);

  if (error) {
    console.error('[db] getUserRunStats failed:', error.message);
    return { totalRuns: 0, winRuns: 0 };
  }

  const rows = data || [];
  const winRuns = rows.filter(
    row => row.state === GameState.Good || row.state === GameState.Best
  ).length;

  return {
    totalRuns: rows.length,
    winRuns,
  };
}

export async function syncAchievements(userId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from('players')
    .select('xp, gold')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error(
      '[db] syncAchievements profile load failed:',
      profileError?.message || 'missing row'
    );
    return;
  }

  const stats = await getUserRunStats(userId);
  const xp = Number(profile.xp || 0);
  const gold = Number(profile.gold || 0);

  const toUnlock: AchievementKey[] = [];
  if (stats.winRuns >= 1) toUnlock.push(AchievementKey.FirstWin);
  if (stats.winRuns >= 10) toUnlock.push(AchievementKey.TenWins);
  if (xp >= 100) toUnlock.push(AchievementKey.Xp100);
  if (gold >= 250) toUnlock.push(AchievementKey.Gold250);

  if (toUnlock.length === 0) {
    return;
  }

  const rows = toUnlock.map(key => ({
    user_id: userId,
    achievement_key: key,
    unlocked_at: new Date().toISOString(),
  }));

  const { error: unlockError } = await supabase
    .from('achievements_unlocked')
    .upsert(rows, { onConflict: 'user_id,achievement_key' });

  if (unlockError) {
    console.error('[db] syncAchievements unlock failed:', unlockError.message);
  }
}

export async function getAchievementsOverview(
  userId: string,
  fr: boolean
): Promise<AchievementOverviewItem[] | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('achievements_unlocked')
    .select('achievement_key, unlocked_at')
    .eq('user_id', userId);

  if (error) {
    console.error('[db] getAchievementsOverview failed:', error.message);
    return null;
  }

  const unlockedRows = (data || []) as AchievementUnlockRow[];
  const unlockedByKey = new Map(
    unlockedRows.map(row => [row.achievement_key, row.unlocked_at])
  );

  return ACHIEVEMENTS.map(achievement => {
    const unlockedAt = unlockedByKey.get(achievement.key) || null;
    return {
      key: achievement.key,
      title: fr ? achievement.titleFr : achievement.titleEn,
      description: fr ? achievement.descriptionFr : achievement.descriptionEn,
      unlocked: Boolean(unlockedAt),
      unlockedAt,
    };
  });
}
