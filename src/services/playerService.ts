import { GameState } from '../objects/enums/GameState';
import { LeaderboardEntry } from '../objects/types/LeaderboardEntry';
import { PlayerProfile } from '../objects/types/PlayerProfile';
import { PlayerRunSummary } from '../objects/types/PlayerRunSummary';
import { withPerf } from '../utils/perfLogger';
import { inferMonsterFromRunKey } from '../utils/runMonsterUtils';
import { getSupabaseAdminClient } from '../utils/supabaseClient';

export async function ensurePlayerProfile(userId: string): Promise<void> {
  await withPerf('playerService', 'ensurePlayerProfile', async () => {
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
  });
}

export async function getPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  return withPerf('playerService', 'getPlayerProfile', async () => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase.from('players').select('user_id, level, xp, gold').eq('user_id', userId).maybeSingle();

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
  });
}

export async function updatePlayerGold(userId: string, delta: number): Promise<number | null> {
  return withPerf('playerService', 'updatePlayerGold', async () => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return null;
    }

    const { data: currentRow, error: loadError } = await supabase.from('players').select('gold').eq('user_id', userId).maybeSingle();

    if (loadError) {
      console.error('[db] updatePlayerGold load failed:', loadError.message);
      return null;
    }

    if (!currentRow) {
      return null;
    }

    const newGold = Math.max(0, Number(currentRow.gold || 0) + delta);
    const { error } = await supabase.from('players').update({ gold: newGold, updated_at: new Date().toISOString() }).eq('user_id', userId);

    if (error) {
      console.error('[db] updatePlayerGold failed:', error.message);
      return null;
    }

    return newGold;
  });
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[] | null> {
  return withPerf('playerService', 'getLeaderboard', async () => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return null;
    }

    const safeLimit = Math.max(1, Math.min(limit, 25));
    const { data, error } = await supabase.from('players').select('user_id, level, xp').order('level', { ascending: false }).order('xp', { ascending: false }).limit(safeLimit);

    if (error) {
      console.error('[db] getLeaderboard failed:', error.message);
      return null;
    }

    return (data || []).map(row => ({
      userId: String(row.user_id),
      level: Number(row.level || 1),
      xp: Number(row.xp || 0),
    }));
  });
}

export async function getPlayerRunSummary(userId: string): Promise<PlayerRunSummary | null> {
  return withPerf('playerService', 'getPlayerRunSummary', async () => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return null;
    }

    const { data: runs, error } = await supabase.from('runs').select('state, monster_name, completed_at, run_key').eq('user_id', userId).order('completed_at', { ascending: false });

    if (error) {
      console.error('[db] getPlayerRunSummary failed:', error.message);
      return null;
    }

    const rows = runs || [];
    const killsByMonster = new Map<string, number>();
    const updates: Array<{ runKey: string; monsterName: string }> = [];

    for (const row of rows) {
      const existingMonster = row.monster_name ? String(row.monster_name) : '';
      const inferredMonster = existingMonster || inferMonsterFromRunKey(String(row.run_key || ''));

      if (!existingMonster && inferredMonster && row.run_key) {
        updates.push({
          runKey: String(row.run_key),
          monsterName: inferredMonster,
        });
      }

      const isWin = row.state === GameState.Good || row.state === GameState.Best;
      if (!isWin || !inferredMonster) {
        continue;
      }

      killsByMonster.set(inferredMonster, (killsByMonster.get(inferredMonster) ?? 0) + 1);
    }

    await Promise.all(
      updates.map(async update => {
        const { error: updateError } = await supabase.from('runs').update({ monster_name: update.monsterName }).eq('run_key', update.runKey).eq('user_id', userId);

        if (updateError) {
          console.error('[db] getPlayerRunSummary backfill failed:', updateError.message);
        }
      })
    );

    return {
      totalRuns: rows.length,
      killedMonsters: Array.from(killsByMonster.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, count]) => ({ name, count })),
    };
  });
}
