import { QUEST_DEFINITIONS } from '../objects/data/progressionCatalog';
import { QuestClaimStatus } from '../objects/enums/QuestClaimStatus';
import { QuestKey } from '../objects/enums/QuestKey';
import { ClaimDailyQuestResult } from '../objects/types/ClaimDailyQuestResult';
import { DailyQuestStatus } from '../objects/types/DailyQuestStatus';
import { QuestDefinition } from '../objects/types/QuestDefinition';
import { getSupabaseAdminClient } from '../utils/supabaseClient';
import { syncAchievements } from './achievementService';
import { ensurePlayerProfile } from './playerService';

export const QUESTS: QuestDefinition[] = QUEST_DEFINITIONS;

const DAILY_QUEST_KEY = QUESTS[0].key;

export function getQuestLabel(questKey: QuestKey | string, fr: boolean): string {
  if (questKey === QuestKey.Win1Run) {
    return fr ? 'Gagner 1 Victoire' : 'Win 1 Battle';
  }
  if (questKey === QuestKey.Play3Runs) {
    return fr ? 'Jouer 3 Combats' : 'Play 3 Battles';
  }
  if (questKey === QuestKey.LevelUpOnce) {
    return fr ? 'Monter de Niveau' : 'Level Up';
  }
  return String(questKey);
}

function getQuestDefinition(questKey: QuestKey | string): QuestDefinition | null {
  return QUESTS.find(q => q.key === questKey) ?? null;
}

function currentQuestDay(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getAllQuestStatuses(userID: string): Promise<DailyQuestStatus[]> {
  return Promise.all(QUESTS.map(q => getDailyQuestStatus(userID, q.key)));
}

export async function getDailyQuestStatus(userId: string, questKey: QuestKey | string = DAILY_QUEST_KEY): Promise<DailyQuestStatus> {
  const supabase = getSupabaseAdminClient();
  const questDef = getQuestDefinition(questKey);

  if (!questDef) {
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
  const { data, error } = await supabase.from('daily_quests_progress').select('progress, claimed').eq('user_id', userId).eq('quest_day', questDay).eq('quest_key', questKey).maybeSingle();

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

export async function claimDailyQuestReward(userId: string, questKey: QuestKey | string = DAILY_QUEST_KEY): Promise<ClaimDailyQuestResult> {
  await ensurePlayerProfile(userId);

  const supabase = getSupabaseAdminClient();
  const questDef = getQuestDefinition(questKey);

  if (!questDef) {
    return { status: QuestClaimStatus.Unavailable, rewardGold: 0 };
  }

  if (!supabase) {
    return { status: QuestClaimStatus.Unavailable, rewardGold: 0 };
  }

  const questStatus = await getDailyQuestStatus(userId, questKey);

  if (questStatus.claimed) {
    return { status: QuestClaimStatus.AlreadyClaimed, rewardGold: 0 };
  }

  if (questStatus.progress < questStatus.target) {
    return { status: QuestClaimStatus.NotCompleted, rewardGold: 0 };
  }

  const { error: markClaimedError } = await supabase.from('daily_quests_progress').update({ claimed: true, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('quest_day', questStatus.questDay).eq('quest_key', questKey).eq('claimed', false);

  if (markClaimedError) {
    console.error('[db] claim quest failed:', markClaimedError.message);
    return { status: QuestClaimStatus.Unavailable, rewardGold: 0 };
  }

  const rollbackClaimed = async () => {
    const { error: rollbackError } = await supabase.from('daily_quests_progress').update({ claimed: false, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('quest_day', questStatus.questDay).eq('quest_key', questKey);

    if (rollbackError) {
      console.error('[db] rollback quest claim failed:', rollbackError.message);
    }
  };

  const { data: player, error: playerError } = await supabase.from('players').select('gold').eq('user_id', userId).single();

  if (playerError || !player) {
    console.error('[db] load player for quest reward failed:', playerError?.message || 'missing row');
    await rollbackClaimed();
    return { status: QuestClaimStatus.Unavailable, rewardGold: 0 };
  }

  const nextGold = Number(player.gold || 0) + questDef.rewardGold;
  const { error: goldError } = await supabase.from('players').update({ gold: nextGold, updated_at: new Date().toISOString() }).eq('user_id', userId);

  if (goldError) {
    console.error('[db] update gold failed:', goldError.message);
    await rollbackClaimed();
    return { status: QuestClaimStatus.Unavailable, rewardGold: 0 };
  }

  await syncAchievements(userId);

  return { status: QuestClaimStatus.Claimed, rewardGold: questDef.rewardGold };
}
