import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminClient;
}
