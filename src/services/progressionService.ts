import { GameState } from '../enums/GameState';
import { getSupabaseAdminClient } from '../utils/supabaseClient';

type RecordRunInput = {
  userId: string;
  payload: string;
  state: GameState;
  training: boolean;
  monsterName: string | null;
};

type PlayerProfile = {
  userId: string;
  level: number;
  xp: number;
  gold: number;
};

type LeaderboardEntry = {
  userId: string;
  level: number;
  xp: number;
};

function shouldPersistRun(state: GameState): boolean {
  return state !== GameState.Incomplete;
}

function countActions(payload: string): number {
  const slashIndex = payload.indexOf('/');
  if (slashIndex === -1) {
    return 0;
  }

  return payload.slice(slashIndex + 1).length;
}

function xpFromState(state: GameState): number {
  switch (state) {
    case GameState.Best:
      return 30;
    case GameState.Good:
      return 20;
    case GameState.Bad:
      return 8;
    case GameState.Giveup:
      return 2;
    default:
      return 0;
  }
}

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

export async function recordRunResult(input: RecordRunInput): Promise<void> {
  if (!shouldPersistRun(input.state)) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const actionCount = countActions(input.payload);
  const runKey = `${input.userId}:${input.payload}`;

  const { error: runError } = await supabase.from('runs').upsert(
    {
      run_key: runKey,
      user_id: input.userId,
      state: input.state,
      training: input.training,
      monster_name: input.monsterName,
      actions_count: actionCount,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'run_key' }
  );

  if (runError) {
    console.error('[db] recordRunResult failed:', runError.message);
    return;
  }

  const gainedXp = xpFromState(input.state);
  if (gainedXp <= 0) {
    return;
  }

  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('xp, level')
    .eq('user_id', input.userId)
    .single();

  if (playerError || !player) {
    console.error(
      '[db] load player profile for xp update failed:',
      playerError?.message || 'missing row'
    );
    return;
  }

  const nextXp = Number(player.xp || 0) + gainedXp;
  const nextLevel = Math.floor(nextXp / 100) + 1;

  const { error: updateError } = await supabase
    .from('players')
    .update({
      xp: nextXp,
      level: nextLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', input.userId);

  if (updateError) {
    console.error('[db] xp update failed:', updateError.message);
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
