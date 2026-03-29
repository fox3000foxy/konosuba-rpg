import { GameState } from '../objects/enums/GameState';
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

type DailyQuestStatus = {
  questKey: string;
  questDay: string;
  progress: number;
  target: number;
  claimed: boolean;
  rewardGold: number;
};

type ClaimDailyQuestResult = {
  status: 'claimed' | 'already-claimed' | 'not-completed' | 'unavailable';
  rewardGold: number;
};

type AchievementDefinition = {
  key: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
};

type AchievementUnlockRow = {
  achievement_key: string;
  unlocked_at: string;
};

type UserRunStats = {
  totalRuns: number;
  winRuns: number;
};

type AchievementOverviewItem = {
  key: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

type QuestDefinition = {
  key: string;
  targetProgress: number;
  rewardGold: number;
  conditionKey: 'win' | 'play' | 'level-up';
};

export const QUESTS: QuestDefinition[] = [
  {
    key: 'win_1_run',
    targetProgress: 1,
    rewardGold: 50,
    conditionKey: 'win',
  },
  {
    key: 'play_3_runs',
    targetProgress: 3,
    rewardGold: 30,
    conditionKey: 'play',
  },
  {
    key: 'level_up_once',
    targetProgress: 1,
    rewardGold: 75,
    conditionKey: 'level-up',
  },
];

// Backward compat constant for first quest
const DAILY_QUEST_KEY = QUESTS[0].key;

function getQuestDefinition(questKey: string): QuestDefinition | null {
  return QUESTS.find(q => q.key === questKey) ?? null;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    key: 'first_win',
    titleFr: 'Premiere victoire',
    titleEn: 'First victory',
    descriptionFr: 'Gagner 1 combat',
    descriptionEn: 'Win 1 battle',
  },
  {
    key: 'ten_wins',
    titleFr: 'Chasseur confirme',
    titleEn: 'Seasoned hunter',
    descriptionFr: 'Gagner 10 combats',
    descriptionEn: 'Win 10 battles',
  },
  {
    key: 'xp_100',
    titleFr: 'Aventurier niveau 2',
    titleEn: 'Adventurer level 2',
    descriptionFr: 'Atteindre 100 XP',
    descriptionEn: 'Reach 100 XP',
  },
  {
    key: 'gold_250',
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

async function syncAchievements(userId: string): Promise<void> {
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

  const toUnlock: string[] = [];
  if (stats.winRuns >= 1) toUnlock.push('first_win');
  if (stats.winRuns >= 10) toUnlock.push('ten_wins');
  if (xp >= 100) toUnlock.push('xp_100');
  if (gold >= 250) toUnlock.push('gold_250');

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

export function getAllQuestStatuses(
  userID: string
): Promise<DailyQuestStatus[]> {
  return Promise.all(QUESTS.map(q => getDailyQuestStatus(userID, q.key)));
}

function currentQuestDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function isWinningState(state: GameState): boolean {
  return state === GameState.Good || state === GameState.Best;
}

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
    console.log(`[db] skipping run: state=${input.state} for user=${input.userId}`);
    return;
  }

  console.log(
    `[db] recording run: user=${input.userId} state=${input.state} training=${input.training} monster=${input.monsterName}`
  );

  // Ensure player exists before recording run (foreign key constraint)
  await ensurePlayerProfile(input.userId);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    console.warn('[db] Supabase client unavailable, run not recorded');
    return;
  }

  const actionCount = countActions(input.payload);
  const runKey = `${input.userId}:${input.payload}`;

  console.log(`[db] upserting run: runKey=${runKey} actions=${actionCount}`);

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

  console.log(`[db] run recorded successfully for user=${input.userId} state=${input.state}`);

  const gainedXp = xpFromState(input.state);
  if (gainedXp <= 0) {
    console.log(`[db] no xp gained for state=${input.state}`);
    return;
  }

  console.log(`[db] loading player profile for xp update: user=${input.userId}`);

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
  const oldLevel = Math.floor(Number(player.xp || 0) / 100) + 1;
  const nextLevel = Math.floor(nextXp / 100) + 1;

  console.log(
    `[db] xp update: user=${input.userId} oldXp=${player.xp} newXp=${nextXp} oldLevel=${oldLevel} newLevel=${nextLevel}`
  );

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
  } else {
    console.log(`[db] xp updated successfully for user=${input.userId}`);
  }

  const questDay = currentQuestDay();
  const isWin = isWinningState(input.state);
  const leveledUp = nextLevel > oldLevel;

  console.log(
    `[db] quest processing: user=${input.userId} questDay=${questDay} isWin=${isWin} leveledUp=${leveledUp}`
  );

  for (const quest of QUESTS) {
    const shouldIncrement =
      quest.conditionKey === 'play' ||
      (quest.conditionKey === 'win' && isWin) ||
      (quest.conditionKey === 'level-up' && leveledUp);

    if (!shouldIncrement) {
      continue;
    }

    console.log(`[db] incrementing quest: key=${quest.key} for user=${input.userId}`);

    const { data: questRow, error: questLoadError } = await supabase
      .from('daily_quests_progress')
      .select('progress, claimed')
      .eq('user_id', input.userId)
      .eq('quest_day', questDay)
      .eq('quest_key', quest.key)
      .maybeSingle();

    if (questLoadError) {
      console.error('[db] load quest progress failed:', questLoadError.message);
      continue;
    }

    if (!questRow) {
      console.log(
        `[db] creating new quest progress: key=${quest.key} user=${input.userId}`
      );

      const { error: questInsertError } = await supabase
        .from('daily_quests_progress')
        .insert({
          user_id: input.userId,
          quest_day: questDay,
          quest_key: quest.key,
          progress: 1,
          claimed: false,
          updated_at: new Date().toISOString(),
        });

      if (questInsertError) {
        console.error(
          '[db] create quest progress failed:',
          questInsertError.message
        );
      } else {
        console.log(
          `[db] quest progress created: key=${quest.key} user=${input.userId}`
        );
      }
      continue;
    }

    if (questRow.claimed) {
      console.log(`[db] quest already claimed: key=${quest.key} user=${input.userId}`);
      continue;
    }

    const nextProgress = Math.min(
      quest.targetProgress,
      Number(questRow.progress || 0) + 1
    );

    console.log(
      `[db] updating quest progress: key=${quest.key} user=${input.userId} from=${questRow.progress} to=${nextProgress}`
    );

    const { error: questUpdateError } = await supabase
      .from('daily_quests_progress')
      .update({ progress: nextProgress, updated_at: new Date().toISOString() })
      .eq('user_id', input.userId)
      .eq('quest_day', questDay)
      .eq('quest_key', quest.key);

    if (questUpdateError) {
      console.error(
        '[db] update quest progress failed:',
        questUpdateError.message
      );
    } else {
      console.log(
        `[db] quest progress updated: key=${quest.key} user=${input.userId} progress=${nextProgress}`
      );
    }
  }

  await syncAchievements(input.userId);

  console.log(`[db] run processing complete for user=${input.userId} state=${input.state}`);
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

export async function getDailyQuestStatus(
  userId: string,
  questKey: string = DAILY_QUEST_KEY
): Promise<DailyQuestStatus> {
  const supabase = getSupabaseAdminClient();
  const questDef = getQuestDefinition(questKey);

  if (!questDef) {
    // Return safe defaults for unknown quest key
    return {
      questKey,
      questDay: currentQuestDay(),
      progress: 0,
      target: 1,
      claimed: false,
      rewardGold: 0,
    };
  }

  if (!supabase) {
    // Return defaults when DB unavailable
    return {
      questKey,
      questDay: currentQuestDay(),
      progress: 0,
      target: questDef.targetProgress,
      claimed: false,
      rewardGold: questDef.rewardGold,
    };
  }

  const questDay = currentQuestDay();
  const { data, error } = await supabase
    .from('daily_quests_progress')
    .select('progress, claimed')
    .eq('user_id', userId)
    .eq('quest_day', questDay)
    .eq('quest_key', questKey)
    .maybeSingle();

  if (error) {
    console.error('[db] getDailyQuestStatus failed:', error.message);
  }

  return {
    questKey,
    questDay,
    progress: Number(data?.progress || 0),
    target: questDef.targetProgress,
    claimed: Boolean(data?.claimed || false),
    rewardGold: questDef.rewardGold,
  };
}

export async function claimDailyQuestReward(
  userId: string,
  questKey: string = DAILY_QUEST_KEY
): Promise<ClaimDailyQuestResult> {
  await ensurePlayerProfile(userId);

  const supabase = getSupabaseAdminClient();
  const questDef = getQuestDefinition(questKey);

  if (!questDef) {
    return { status: 'unavailable', rewardGold: 0 };
  }

  if (!supabase) {
    return { status: 'unavailable', rewardGold: 0 };
  }

  const questStatus = await getDailyQuestStatus(userId, questKey);

  if (questStatus.claimed) {
    return { status: 'already-claimed', rewardGold: 0 };
  }

  if (questStatus.progress < questStatus.target) {
    return { status: 'not-completed', rewardGold: 0 };
  }

  const { error: markClaimedError } = await supabase
    .from('daily_quests_progress')
    .update({ claimed: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('quest_day', questStatus.questDay)
    .eq('quest_key', questKey)
    .eq('claimed', false);

  if (markClaimedError) {
    console.error('[db] claim quest failed:', markClaimedError.message);
    return { status: 'unavailable', rewardGold: 0 };
  }

  const rollbackClaimed = async () => {
    const { error: rollbackError } = await supabase
      .from('daily_quests_progress')
      .update({ claimed: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('quest_day', questStatus.questDay)
      .eq('quest_key', questKey);

    if (rollbackError) {
      console.error('[db] rollback quest claim failed:', rollbackError.message);
    }
  };

  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('gold')
    .eq('user_id', userId)
    .single();

  if (playerError || !player) {
    console.error(
      '[db] load player for quest reward failed:',
      playerError?.message || 'missing row'
    );
    await rollbackClaimed();
    return { status: 'unavailable', rewardGold: 0 };
  }

  const nextGold = Number(player.gold || 0) + questDef.rewardGold;
  const { error: goldError } = await supabase
    .from('players')
    .update({ gold: nextGold, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (goldError) {
    console.error('[db] update gold failed:', goldError.message);
    await rollbackClaimed();
    return { status: 'unavailable', rewardGold: 0 };
  }

  await syncAchievements(userId);

  return { status: 'claimed', rewardGold: questDef.rewardGold };
}
