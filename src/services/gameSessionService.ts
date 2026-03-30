import { RawButton } from '../objects/enums/RawButton';
import { getSupabaseAdminClient } from '../utils/supabaseClient';

const TOKEN_PREFIX = 'gs.';
const TOKEN_SIZE = 10;
const TOKEN_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

type SessionTokenRow = {
  payload: string;
  token: string;
  owner_user_id: string;
  expires_at: string;
};

type SessionEntry = {
  payload: string;
  ownerUserId: string;
  expiresAt: number;
};

type GameSessionGlobals = {
  __gameSessionPayloadToToken?: Map<string, string>; // key: owner::payload
  __gameSessionTokenToSession?: Map<string, SessionEntry>;
};

const G = globalThis as unknown as GameSessionGlobals;
G.__gameSessionPayloadToToken ??= new Map<string, string>();
G.__gameSessionTokenToSession ??= new Map<string, SessionEntry>();

const payloadToToken = G.__gameSessionPayloadToToken;
const tokenToSession = G.__gameSessionTokenToSession;

function hasCustomId(component: unknown): component is { custom_id: string } {
  if (!component || typeof component !== 'object') {
    return false;
  }

  return (
    'custom_id' in component &&
    typeof (component as { custom_id?: unknown }).custom_id === 'string'
  );
}

function randomToken(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * TOKEN_CHARS.length);
    out += TOKEN_CHARS[idx];
  }

  return out;
}

function nowMs(): number {
  return Date.now();
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

function sessionCacheKey(ownerUserId: string, payload: string): string {
  return `${ownerUserId}::${payload}`;
}

function parseExpiresAt(value: string | null | undefined): number {
  if (!value) {
    return nowMs() + SESSION_TTL_MS;
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return nowMs() + SESSION_TTL_MS;
  }

  return parsed;
}

function buildSessionEntry(row: SessionTokenRow): SessionEntry {
  return {
    payload: String(row.payload),
    ownerUserId: String(row.owner_user_id),
    expiresAt: parseExpiresAt(row.expires_at),
  };
}

function isExpired(entry: SessionEntry): boolean {
  return entry.expiresAt <= nowMs();
}

function parseCustomId(customId: string): { payload: string; owner: string } {
  const colonIdx = customId.lastIndexOf(':');
  if (colonIdx === -1) {
    return { payload: customId, owner: '' };
  }

  return {
    payload: customId.slice(0, colonIdx),
    owner: customId.slice(colonIdx + 1),
  };
}

function needsEncoding(payload: string): boolean {
  if (!payload) {
    return false;
  }

  if (payload.startsWith('menu.')) {
    return false;
  }

  if (payload.startsWith(TOKEN_PREFIX)) {
    return false;
  }

  if (payload === 'consumables') {
    return false;
  }

  return true;
}

async function loadTokenRowsByPayload(
  ownerUserId: string,
  payloads: string[]
): Promise<Map<string, SessionEntry>> {
  const result = new Map<string, SessionEntry>();
  const supabase = getSupabaseAdminClient();
  if (!supabase || payloads.length === 0) {
    return result;
  }

  const { data, error } = await supabase
    .from('game_sessions')
    .select('payload, token, owner_user_id, expires_at')
    .eq('owner_user_id', ownerUserId)
    .in('payload', payloads);

  if (error) {
    console.error('[db] load game sessions by payload failed:', error.message);
    return result;
  }

  for (const row of (data || []) as SessionTokenRow[]) {
    const token = String(row.token);
    const entry = buildSessionEntry(row);
    result.set(String(row.payload), entry);
    tokenToSession.set(token, entry);
    payloadToToken.set(sessionCacheKey(ownerUserId, String(row.payload)), token);
  }

  return result;
}

async function loadTokenRowByToken(token: string): Promise<SessionEntry | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase || !token) {
    return null;
  }

  const { data, error } = await supabase
    .from('game_sessions')
    .select('payload, token, owner_user_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (error) {
    console.error('[db] load game session by token failed:', error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  const row = data as SessionTokenRow;
  const entry = buildSessionEntry(row);
  tokenToSession.set(String(row.token), entry);
  payloadToToken.set(
    sessionCacheKey(String(row.owner_user_id), String(row.payload)),
    String(row.token)
  );
  return entry;
}

async function createMissingSessionRows(
  ownerUserId: string,
  payloads: string[]
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase || payloads.length === 0) {
    return;
  }

  const expiresAt = nowMs() + SESSION_TTL_MS;
  const rows = payloads.map(payload => ({
    payload,
    owner_user_id: ownerUserId,
    token: randomToken(TOKEN_SIZE),
    expires_at: toIso(expiresAt),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('game_sessions')
    .upsert(rows, { onConflict: 'owner_user_id,payload', ignoreDuplicates: true });

  if (error) {
    console.error('[db] create game sessions failed:', error.message);
  }
}

async function getPayloadTokenMap(
  ownerUserId: string,
  payloads: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const missing: string[] = [];

  for (const payload of payloads) {
    const key = sessionCacheKey(ownerUserId, payload);
    const token = payloadToToken.get(key);
    const entry = token ? tokenToSession.get(token) : null;
    if (token && entry && !isExpired(entry)) {
      map.set(payload, token);
      continue;
    }

    if (token && entry && isExpired(entry)) {
      payloadToToken.delete(key);
      tokenToSession.delete(token);
    }

    missing.push(payload);
  }

  if (missing.length === 0) {
    return map;
  }

  const foundRows = await loadTokenRowsByPayload(ownerUserId, missing);
  for (const [payload, entry] of foundRows.entries()) {
    if (isExpired(entry)) {
      continue;
    }

    const token = payloadToToken.get(sessionCacheKey(ownerUserId, payload));
    if (!token) {
      continue;
    }

    map.set(payload, token);
  }

  const stillMissing = missing.filter(payload => !map.has(payload));
  if (stillMissing.length > 0) {
    await createMissingSessionRows(ownerUserId, stillMissing);
    const createdRows = await loadTokenRowsByPayload(ownerUserId, stillMissing);

    for (const [payload, entry] of createdRows.entries()) {
      if (isExpired(entry)) {
        continue;
      }

      const token = payloadToToken.get(sessionCacheKey(ownerUserId, payload));
      if (!token) {
        continue;
      }

      map.set(payload, token);
    }
  }

  // Fallback when DB is unavailable: keep routing functional with memory-only tokens.
  for (const payload of stillMissing) {
    if (map.has(payload)) {
      continue;
    }

    const token = randomToken(TOKEN_SIZE);
    const expiresAt = nowMs() + SESSION_TTL_MS;
    const entry: SessionEntry = {
      payload,
      ownerUserId,
      expiresAt,
    };

    payloadToToken.set(sessionCacheKey(ownerUserId, payload), token);
    tokenToSession.set(token, entry);
    map.set(payload, token);
  }

  return map;
}

export async function encodeGameplayButtons(
  buttons: RawButton[]
): Promise<RawButton[]> {
  const payloadsByOwner = new Map<string, Set<string>>();

  for (const row of buttons) {
    for (const component of row.components) {
      if (!hasCustomId(component)) {
        continue;
      }

      const { payload, owner } = parseCustomId(component.custom_id);
      if (needsEncoding(payload)) {
        const ownerKey = owner || 'all';
        if (!payloadsByOwner.has(ownerKey)) {
          payloadsByOwner.set(ownerKey, new Set<string>());
        }

        payloadsByOwner.get(ownerKey)?.add(payload);
      }
    }
  }

  const payloadTokenMapByOwner = new Map<string, Map<string, string>>();
  for (const [owner, payloads] of payloadsByOwner.entries()) {
    const map = await getPayloadTokenMap(owner, [...payloads]);
    payloadTokenMapByOwner.set(owner, map);
  }

  return buttons.map(row => ({
    ...row,
    components: row.components.map(component => {
      if (!hasCustomId(component)) {
        return component;
      }

      const { payload, owner } = parseCustomId(component.custom_id);
      if (!needsEncoding(payload)) {
        return component;
      }

      const ownerKey = owner || 'all';
      const token = payloadTokenMapByOwner.get(ownerKey)?.get(payload);
      if (!token) {
        return component;
      }

      return {
        ...component,
        custom_id: `${TOKEN_PREFIX}${token}${owner ? `:${owner}` : ''}`,
      };
    }),
  }));
}

export async function decodeGameplayPayload(
  encodedPayload: string,
  userID: string
): Promise<string | null> {
  if (!encodedPayload.startsWith(TOKEN_PREFIX)) {
    return encodedPayload;
  }

  const token = encodedPayload.slice(TOKEN_PREFIX.length);
  if (!token) {
    return null;
  }

  const cached = tokenToSession.get(token);
  if (cached) {
    if (cached.ownerUserId !== userID && cached.ownerUserId !== 'all') {
      return null;
    }

    if (isExpired(cached)) {
      tokenToSession.delete(token);
      payloadToToken.delete(sessionCacheKey(cached.ownerUserId, cached.payload));
      return null;
    }

    return cached.payload;
  }

  const entry = await loadTokenRowByToken(token);
  if (!entry) {
    return null;
  }

  if (entry.ownerUserId !== userID && entry.ownerUserId !== 'all') {
    return null;
  }

  if (isExpired(entry)) {
    return null;
  }

  return entry.payload;
}
