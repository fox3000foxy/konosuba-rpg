import { LeaderboardEntry } from '../objects/types/LeaderboardEntry';
import { PlayerProfile } from '../objects/types/PlayerProfile';
import { getSupabaseAdminClient } from '../utils/supabaseClient';

export async function ensurePlayerProfile(userId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from('players').upsert(
    {
      user_id: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('[db] ensurePlayerProfile failed:', error.message);
  }
}

export async function getPlayerProfile(
  userId: string
): Promise<PlayerProfile | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('players')
    .select('user_id, level, xp, gold')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[db] getPlayerProfile failed:', error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    userId: String(data.user_id),
    level: Number(data.level || 1),
    xp: Number(data.xp || 0),
    gold: Number(data.gold || 0),
  };
}

export async function getLeaderboard(
  limit = 10
): Promise<LeaderboardEntry[] | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const safeLimit = Math.max(1, Math.min(limit, 25));
  const { data, error } = await supabase
    .from('players')
    .select('user_id, level, xp')
    .order('level', { ascending: false })
    .order('xp', { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error('[db] getLeaderboard failed:', error.message);
    return null;
  }

  return (data || []).map(row => ({
    userId: String(row.user_id),
    level: Number(row.level || 1),
    xp: Number(row.xp || 0),
  }));
}
