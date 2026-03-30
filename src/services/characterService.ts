import { CharacterKey } from '../objects/enums/CharacterKey';
import { CharacterProgress } from '../objects/types/CharacterProgress';
import { CharacterStatsSnapshot } from '../objects/types/CharacterStatsSnapshot';
import { getSupabaseAdminClient } from '../utils/supabaseClient';

const CHARACTER_KEYS: CharacterKey[] = [
  CharacterKey.Darkness,
  CharacterKey.Aqua,
  CharacterKey.Megumin,
];

const clampLevel = (level: number) => Math.max(1, level);

export function computeLevelFromXp(xp: number): number {
  return clampLevel(Math.floor(Math.max(0, xp) / 100) + 1);
}

export function getLevelFactor(level: number): number {
  return 1 + 0.2 * (clampLevel(level) - 1);
}

export async function ensureCharacterProgress(userId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const rows = CHARACTER_KEYS.map(characterKey => ({
    user_id: userId,
    character_key: characterKey,
    xp: 0,
    level: 1,
    affinity: 0,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('character_progress')
    .upsert(rows, { onConflict: 'user_id,character_key' });

  if (error) {
    console.error('[db] ensureCharacterProgress failed:', error.message);
  }
}

export async function getCharacterProgress(
  userId: string,
  characterKey: CharacterKey
): Promise<CharacterProgress | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('character_progress')
    .select('user_id, character_key, xp, level, affinity')
    .eq('user_id', userId)
    .eq('character_key', characterKey)
    .maybeSingle();

  if (error) {
    console.error('[db] getCharacterProgress failed:', error.message);
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

export async function getCharacterProgresses(
  userId: string
): Promise<CharacterProgress[] | null> {
  await ensureCharacterProgress(userId);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('character_progress')
    .select('user_id, character_key, xp, level, affinity')
    .eq('user_id', userId);

  if (error) {
    console.error('[db] getCharacterProgresses failed:', error.message);
    return null;
  }

  return (data || []).map(row => ({
    userId: String(row.user_id),
    characterKey: String(row.character_key) as CharacterKey,
    xp: Number(row.xp || 0),
    level: Number(row.level || 1),
    affinity: Number(row.affinity || 0),
  }));
}

export async function addCharacterXp(
  userId: string,
  characterKey: CharacterKey,
  amount: number
): Promise<void> {
  if (amount <= 0) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await ensureCharacterProgress(userId);

  const current = await getCharacterProgress(userId, characterKey);
  const currentXp = Number(current?.xp || 0);
  const nextXp = currentXp + amount;
  const nextLevel = computeLevelFromXp(nextXp);

  const { error } = await supabase
    .from('character_progress')
    .update({
      xp: nextXp,
      level: nextLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('character_key', characterKey);

  if (error) {
    console.error('[db] addCharacterXp failed:', error.message);
  }
}

export async function addCharacterAffinity(
  userId: string,
  characterKey: CharacterKey,
  amount: number
): Promise<void> {
  if (amount <= 0) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await ensureCharacterProgress(userId);

  const current = await getCharacterProgress(userId, characterKey);
  const nextAffinity = Number(current?.affinity || 0) + amount;

  const { error } = await supabase
    .from('character_progress')
    .update({
      affinity: nextAffinity,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('character_key', characterKey);

  if (error) {
    console.error('[db] addCharacterAffinity failed:', error.message);
  }
}

export async function getCharacterStatsSnapshot(
  userId: string
): Promise<CharacterStatsSnapshot[] | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data: playerRow, error: playerError } = await supabase
    .from('players')
    .select('level')
    .eq('user_id', userId)
    .maybeSingle();

  if (playerError) {
    console.error(
      '[db] getCharacterStatsSnapshot player load failed:',
      playerError.message
    );
    return null;
  }

  const kazumaLevel = Number(playerRow?.level || 1);
  const progresses = await getCharacterProgresses(userId);
  if (!progresses) {
    return null;
  }

  const byKey = new Map(
    progresses.map(progress => [progress.characterKey, progress])
  );

  return [
    {
      characterKey: 'kazuma',
      level: clampLevel(kazumaLevel),
      factor: getLevelFactor(kazumaLevel),
    },
    {
      characterKey: CharacterKey.Darkness,
      level: Number(byKey.get(CharacterKey.Darkness)?.level || 1),
      factor: getLevelFactor(
        Number(byKey.get(CharacterKey.Darkness)?.level || 1)
      ),
    },
    {
      characterKey: CharacterKey.Megumin,
      level: Number(byKey.get(CharacterKey.Megumin)?.level || 1),
      factor: getLevelFactor(
        Number(byKey.get(CharacterKey.Megumin)?.level || 1)
      ),
    },
    {
      characterKey: CharacterKey.Aqua,
      level: Number(byKey.get(CharacterKey.Aqua)?.level || 1),
      factor: getLevelFactor(Number(byKey.get(CharacterKey.Aqua)?.level || 1)),
    },
  ];
}
