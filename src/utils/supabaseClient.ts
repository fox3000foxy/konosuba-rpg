import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminClient: SupabaseClient | null = null;

function normalizeSecret(raw: string | undefined): string {
  if (!raw) {
    return '';
  }

  let value = raw.trim();

  // Common copy/paste issue from dashboards: wrapping quotes.
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }

  // Users sometimes paste full Authorization header values.
  if (value.toLowerCase().startsWith('bearer ')) {
    value = value.slice(7).trim();
  }

  return value;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadB64.padEnd(Math.ceil(payloadB64.length / 4) * 4, '=');
    const json = Buffer.from(padded, 'base64').toString('utf8');
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

  const supabaseUrl = normalizeSecret(process.env.SUPABASE_URL);
  const serviceRoleKey = normalizeSecret(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  const payload = decodeJwtPayload(serviceRoleKey);
  if (payload && payload.role !== 'service_role') {
    console.warn(
      `[db] SUPABASE_SERVICE_ROLE_KEY role is "${String(payload.role)}" instead of "service_role".`
    );
  }

  supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminClient;
}
