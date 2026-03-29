import { config } from 'dotenv';
import { getSupabaseAdminClient } from '../src/utils/supabaseClient';

config();

type Outcome = {
  ok: boolean;
  step: string;
  message: string;
};

async function run(): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error(
      'Supabase client unavailable. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
    );
  }

  const checkId = `healthcheck:${Date.now()}`;
  const outcomes: Outcome[] = [];

  const { error: upsertError } = await supabase.from('players').upsert(
    {
      user_id: checkId,
      level: 1,
      xp: 0,
      gold: 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  outcomes.push({
    ok: !upsertError,
    step: 'CREATE/UPSERT players',
    message: upsertError?.message || 'ok',
  });

  const { data: createdRow, error: readError } = await supabase
    .from('players')
    .select('user_id, gold, level, xp')
    .eq('user_id', checkId)
    .maybeSingle();

  outcomes.push({
    ok: !readError && Boolean(createdRow),
    step: 'READ players',
    message: readError?.message || (createdRow ? 'ok' : 'row not found'),
  });

  const { error: updateError } = await supabase
    .from('players')
    .update({ gold: 42, updated_at: new Date().toISOString() })
    .eq('user_id', checkId);

  outcomes.push({
    ok: !updateError,
    step: 'UPDATE players',
    message: updateError?.message || 'ok',
  });

  const { data: updatedRow, error: verifyUpdateError } = await supabase
    .from('players')
    .select('gold')
    .eq('user_id', checkId)
    .maybeSingle();

  outcomes.push({
    ok: !verifyUpdateError && Number(updatedRow?.gold || 0) === 42,
    step: 'VERIFY UPDATE',
    message:
      verifyUpdateError?.message ||
      `gold=${String(updatedRow?.gold ?? 'null')} (expected 42)`,
  });

  const { error: deleteError } = await supabase
    .from('players')
    .delete()
    .eq('user_id', checkId);

  outcomes.push({
    ok: !deleteError,
    step: 'DELETE players',
    message: deleteError?.message || 'ok',
  });

  const { data: afterDeleteRow, error: verifyDeleteError } = await supabase
    .from('players')
    .select('user_id')
    .eq('user_id', checkId)
    .maybeSingle();

  outcomes.push({
    ok: !verifyDeleteError && !afterDeleteRow,
    step: 'VERIFY DELETE',
    message:
      verifyDeleteError?.message || (afterDeleteRow ? 'row still exists' : 'ok'),
  });

  for (const outcome of outcomes) {
    const prefix = outcome.ok ? '[OK]' : '[FAIL]';
    console.log(`${prefix} ${outcome.step}: ${outcome.message}`);
  }

  const hasFailure = outcomes.some(outcome => !outcome.ok);
  if (hasFailure) {
    throw new Error('Supabase CRUD check failed. See [FAIL] lines above.');
  }

  console.log('[db] Supabase service role CRUD check passed.');
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[db] Supabase CRUD check failed: ${message}`);
  process.exit(1);
});
