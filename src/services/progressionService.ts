import { AccessoryId } from '../objects/enums/AccessoryId';
import { CharacterKey } from '../objects/enums/CharacterKey';
import { GameState } from '../objects/enums/GameState';
import { QuestConditionKey } from '../objects/enums/QuestConditionKey';
import { RecordRunInput } from '../objects/types/RecordRunInput';
import { withPerf } from '../utils/perfLogger';
import { getSupabaseAdminClient } from '../utils/supabaseClient';
import { getItemById as getAccessoryById } from './accessoryService';
import { syncAchievements } from './achievementService';
import { addCharacterAffinity, addCharacterXp } from './characterService';
import { ACCESSORY_AFFINITY_POINTS_BY_RARITY, grantAccessoryDropRewards, grantConsumableDropRewards } from './dropService';
import { consumeInventoryItem } from './inventoryConsumptionService';
import { ensurePlayerProfile } from './playerService';
import { QUESTS } from './questService';
import { DonateAccessoryResult } from './types/progression';

export { ACHIEVEMENTS, getAchievementsOverview } from './achievementService';
export { addCharacterAffinity, addCharacterXp, computeLevelFromXp, getCharacterProgress, getCharacterProgresses, getCharacterStatsSnapshot, getLevelFactor } from './characterService';
export { ensurePlayerProfile, getLeaderboard, getPlayerProfile, getPlayerRunSummary } from './playerService';
export { claimDailyQuestReward, getAllQuestStatuses, getDailyQuestStatus, getQuestLabel, QUESTS } from './questService';

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
      return 0;
    case GameState.Giveup:
      return 0;
    default:
      return 0;
  }
}

type DailyQuestProgressRow = {
  quest_key: string;
  progress: number | null;
  claimed: boolean | null;
};

export async function donateAccessoryToCharacter(userId: string, accessoryId: string, characterKey: CharacterKey): Promise<DonateAccessoryResult> {
  return withPerf('progressionService', 'donateAccessoryToCharacter', async () => {
    const accessory = getAccessoryById(accessoryId as AccessoryId);
    if (!accessory) {
      return {
        success: false,
        affinityPoints: 0,
        reason: 'invalid-accessory',
      };
    }

    const affinityPoints = ACCESSORY_AFFINITY_POINTS_BY_RARITY[accessory.rarity] || 0;
    if (affinityPoints <= 0) {
      return {
        success: false,
        affinityPoints: 0,
        reason: 'invalid-accessory',
      };
    }

    const consumed = await consumeInventoryItem(userId, accessory.id, 1);
    if (!consumed) {
      return {
        success: false,
        affinityPoints: 0,
        reason: 'out-of-stock',
      };
    }

    await addCharacterAffinity(userId, characterKey, affinityPoints);

    return {
      success: true,
      affinityPoints,
    };
  });
}

export async function recordRunResult(input: RecordRunInput): Promise<void> {
  return withPerf('progressionService', 'recordRunResult', async () => {
    if (!shouldPersistRun(input.state)) {
      console.log(`[db] skipping run: state=${input.state} for user=${input.userId}`);
      return;
    }

    console.log(`[db] recording run: user=${input.userId} state=${input.state} training=${input.training} monster=${input.monsterName}`);

    // Ensure player exists before recording run (foreign key constraint)
    await ensurePlayerProfile(input.userId);

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
    let leveledUp = false;
    let oldLevel;
    let nextLevel;

    console.log(`[db] loading player profile for quest and xp evaluation: user=${input.userId}`);

    const { data: player, error: playerError } = await supabase.from('players').select('xp, level').eq('user_id', input.userId).single();

    if (playerError || !player) {
      console.error('[db] load player profile failed:', playerError?.message || 'missing row');
    } else {
      const currentXp = Number(player.xp || 0);
      oldLevel = Math.floor(currentXp / 100) + 1;
      const nextXpValue = currentXp + gainedXp;
      nextLevel = Math.floor(nextXpValue / 100) + 1;

      console.log(`[db] xp update: user=${input.userId} oldXp=${currentXp} newXp=${nextXpValue} oldLevel=${oldLevel} newLevel=${nextLevel}`);

      const { error: updateError } = await supabase
        .from('players')
        .update({
          xp: nextXpValue,
          level: nextLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', input.userId);

      if (updateError) {
        console.error('[db] xp update failed:', updateError.message);
      } else {
        console.log(`[db] xp updated successfully for user=${input.userId}`);
      }

      if (gainedXp > 0) {
        leveledUp = nextLevel > oldLevel;
      } else {
        console.log(`[db] no xp gained for state=${input.state}`);
        leveledUp = false;
      }
    }

    if (gainedXp > 0) {
      await Promise.all([addCharacterXp(input.userId, CharacterKey.Darkness, gainedXp), addCharacterXp(input.userId, CharacterKey.Megumin, gainedXp), addCharacterXp(input.userId, CharacterKey.Aqua, gainedXp)]);
    }

    if (isWin) {
      const [accessoryDrops, consumableDrops] = await Promise.all([grantAccessoryDropRewards(input.userId, runKey, input.monsterName), grantConsumableDropRewards(input.userId, runKey, input.monsterName)]);

      if (accessoryDrops && accessoryDrops.length > 0) {
        for (const drop of accessoryDrops) {
          console.log(`[db] accessory drop granted: user=${input.userId} item=${drop.accessoryId} rarity=${drop.rarity} affinity=${drop.affinityPoints} target=${drop.characterKey}`);
        }
      }

      if (consumableDrops && consumableDrops.length > 0) {
        for (const drop of consumableDrops) {
          console.log(`[db] consumable drop granted: user=${input.userId} item=${drop.itemId} rarity=${drop.rarity} type=${drop.itemType} inventoryType=${drop.inventoryItemType}`);
        }
      }
    }

    const questDay = currentQuestDay();

    console.log(`[db] quest processing: user=${input.userId} questDay=${questDay} isWin=${isWin} leveledUp=${leveledUp}`);

    const questsToIncrement = QUESTS.filter(
      quest =>
        quest.conditionKey === QuestConditionKey.Play ||
        (quest.conditionKey === QuestConditionKey.Win && isWin) ||
        (quest.conditionKey === QuestConditionKey.LevelUp && leveledUp)
    );

    if (questsToIncrement.length > 0) {
      const { data: questRows, error: questLoadError } = await supabase
        .from('daily_quests_progress')
        .select('quest_key, progress, claimed')
        .eq('user_id', input.userId)
        .eq('quest_day', questDay);

      if (questLoadError) {
        console.error('[db] load quest progress failed:', questLoadError.message);
      } else {
        const rowsByQuestKey = new Map(
          ((questRows || []) as DailyQuestProgressRow[]).map(row => [String(row.quest_key), row])
        );

        const rowsToInsert: Array<{
          user_id: string;
          quest_day: string;
          quest_key: string;
          progress: number;
          claimed: boolean;
          updated_at: string;
        }> = [];

        await Promise.all(
          questsToIncrement.map(async quest => {
            console.log(`[db] incrementing quest: key=${quest.key} for user=${input.userId}`);

            const questRow = rowsByQuestKey.get(quest.key);
            if (!questRow) {
              rowsToInsert.push({
                user_id: input.userId,
                quest_day: questDay,
                quest_key: quest.key,
                progress: 1,
                claimed: false,
                updated_at: new Date().toISOString(),
              });
              return;
            }

            if (questRow.claimed) {
              console.log(`[db] quest already claimed: key=${quest.key} user=${input.userId}`);
              return;
            }

            const currentProgress = Number(questRow.progress || 0);
            const nextProgress = Math.min(quest.targetProgress, currentProgress + 1);
            console.log(`[db] updating quest progress: key=${quest.key} user=${input.userId} from=${currentProgress} to=${nextProgress}`);

            const { error: questUpdateError } = await supabase
              .from('daily_quests_progress')
              .update({ progress: nextProgress, updated_at: new Date().toISOString() })
              .eq('user_id', input.userId)
              .eq('quest_day', questDay)
              .eq('quest_key', quest.key)
              .eq('claimed', false);

            if (questUpdateError) {
              console.error('[db] update quest progress failed:', questUpdateError.message);
            } else {
              console.log(`[db] quest progress updated: key=${quest.key} user=${input.userId} progress=${nextProgress}`);
            }
          })
        );

        if (rowsToInsert.length > 0) {
          const { error: questInsertError } = await supabase
            .from('daily_quests_progress')
            .insert(rowsToInsert);

          if (questInsertError) {
            console.error('[db] create quest progress failed:', questInsertError.message);
          } else {
            for (const row of rowsToInsert) {
              console.log(`[db] quest progress created: key=${row.quest_key} user=${input.userId}`);
            }
          }
        }
      }
    }

    await syncAchievements(input.userId);

    console.log(`[db] run processing complete for user=${input.userId} state=${input.state}`);
  });
}
