import { CharacterKey } from '../objects/enums/CharacterKey';
import { GameState } from '../objects/enums/GameState';
import { QuestConditionKey } from '../objects/enums/QuestConditionKey';
import { RecordRunInput } from '../objects/types/RecordRunInput';
import { getSupabaseAdminClient } from '../utils/supabaseClient';
import { syncAchievements } from './achievementService';
import {
  addCharacterXp,
  ensureCharacterProgress
} from './characterService';
import { grantAccessoryDropRewards } from './dropService';
import { ensurePlayerProfile } from './playerService';
import { QUESTS } from './questService';

export { ACHIEVEMENTS, getAchievementsOverview } from './achievementService';
export {
  addCharacterAffinity,
  addCharacterXp, computeLevelFromXp, ensureCharacterProgress,
  getCharacterProgress,
  getCharacterProgresses,
  getCharacterStatsSnapshot, getLevelFactor
} from './characterService';
export {
  ensurePlayerProfile,
  getLeaderboard,
  getPlayerProfile,
  getPlayerRunSummary
} from './playerService';
export {
  claimDailyQuestReward,
  getAllQuestStatuses,
  getDailyQuestStatus,
  QUESTS
} from './questService';

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
  await ensureCharacterProgress(input.userId);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    console.warn('[db] Supabase client unavailable, run not recorded');
    return;
  }

  const actionCount = countActions(input.payload);
  const runKey = `${input.userId}:${input.payload}`;
  const isWin = isWinningState(input.state);

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

  await Promise.all([
    addCharacterXp(input.userId, CharacterKey.Darkness, gainedXp),
    addCharacterXp(input.userId, CharacterKey.Megumin, gainedXp),
    addCharacterXp(input.userId, CharacterKey.Aqua, gainedXp),
  ]);

  if (isWin) {
    const drop = await grantAccessoryDropRewards(input.userId, runKey, input.monsterName);
    if (drop) {
      console.log(
        `[db] accessory drop granted: user=${input.userId} item=${drop.accessoryId} rarity=${drop.rarity} affinity=${drop.affinityPoints} target=${drop.characterKey}`
      );
    }
  }

  const questDay = currentQuestDay();
  const leveledUp = nextLevel > oldLevel;

  console.log(
    `[db] quest processing: user=${input.userId} questDay=${questDay} isWin=${isWin} leveledUp=${leveledUp}`
  );

  for (const quest of QUESTS) {
    const shouldIncrement =
      quest.conditionKey === QuestConditionKey.Play ||
      (quest.conditionKey === QuestConditionKey.Win && isWin) ||
      (quest.conditionKey === QuestConditionKey.LevelUp && leveledUp);

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
