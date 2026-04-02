import { RawButton } from '../objects/enums/RawButton';
import { getSupabaseAdminClient } from '../utils/supabaseClient';
import { DecodeGameplayPayloadResult } from './types/gameSession';

const TOKEN_PREFIX = 'gs.';
const TOKEN_SIZE = 10;
const TOKEN_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PRUNE_INTERVAL_MS = 10 * 60 * 1000;

type SessionTokenRow = {
  token: string;
  payload: string;
  owner_user_id: string;
  battle_key: string;
  turn_version: number;
  expires_at: string;
};

type SessionEntry = {
  token: string;
  payload: string;
  ownerUserId: string;
  battleKey: string;
  turnVersion: number;
  expiresAt: number;
};

type GameSessionGlobals = {
  __gameSessionTokenToSession?: Map<string, SessionEntry>;
  __gameSessionLatestTurnByBattle?: Map<string, number>;
  __gameSessionLastPruneAt?: number;
};

const G = globalThis as unknown as GameSessionGlobals;
G.__gameSessionTokenToSession ??= new Map<string, SessionEntry>();
G.__gameSessionLatestTurnByBattle ??= new Map<string, number>();
G.__gameSessionLastPruneAt ??= 0;

const tokenToSession = G.__gameSessionTokenToSession;
const latestTurnByBattle = G.__gameSessionLatestTurnByBattle;
let lastPruneAt = G.__gameSessionLastPruneAt;

function hasCustomId(component: unknown): component is { custom_id: string } {
  if (!component || typeof component !== 'object') {
    return false;
  }

  return 'custom_id' in component && typeof (component as { custom_id?: unknown }).custom_id === 'string';
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

function battleCacheKey(ownerUserId: string, battleKey: string): string {
  return `${ownerUserId}::${battleKey}`;
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

async function pruneExpiredSessions(force = false): Promise<void> {
  const now = nowMs();

  for (const [token, entry] of tokenToSession.entries()) {
    if (entry.expiresAt <= now) {
      tokenToSession.delete(token);
    }
  }

  if (!force && now - lastPruneAt < PRUNE_INTERVAL_MS) {
    return;
  }

  lastPruneAt = now;
  G.__gameSessionLastPruneAt = now;

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from('game_sessions').delete().lt('expires_at', new Date(now).toISOString());

  if (error) {
    console.error('[db] prune expired game sessions failed:', error.message);
  }
}

function buildSessionEntry(row: SessionTokenRow): SessionEntry {
  return {
    token: String(row.token),
    payload: String(row.payload),
    ownerUserId: String(row.owner_user_id),
    battleKey: String(row.battle_key || row.payload),
    turnVersion: Number(row.turn_version || 1),
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

  if (payload === 'useitem') {
    return false;
  }

  return true;
}

export function extractBattleKeyFromPayload(payload: string): string {
  const cleanPayload = payload.replace(/\[.*?\]/g, '');
  const slashIndex = cleanPayload.indexOf('/');
  if (slashIndex === -1) {
    return cleanPayload;
  }

  return cleanPayload.slice(0, slashIndex);
}

async function getLatestTurnVersion(ownerUserId: string, battleKey: string): Promise<number> {
  const key = battleCacheKey(ownerUserId, battleKey);
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return latestTurnByBattle.get(key) || 1;
  }

  const { data, error } = await supabase.from('game_sessions').select('turn_version').eq('owner_user_id', ownerUserId).eq('battle_key', battleKey).order('turn_version', { ascending: false }).limit(1).maybeSingle();

  if (error) {
    console.error('[db] load latest turn version failed:', error.message);
    return latestTurnByBattle.get(key) || 1;
  }

  const latest = Number(data?.turn_version || 1);
  latestTurnByBattle.set(key, latest);
  return latest;
}

async function reserveNextTurnVersion(ownerUserId: string, battleKey: string): Promise<number> {
  const key = battleCacheKey(ownerUserId, battleKey);
  const latest = await getLatestTurnVersion(ownerUserId, battleKey);
  const next = Math.max(1, latest + 1);
  latestTurnByBattle.set(key, next);
  return next;
}

async function insertSessionRows(
  rows: Array<{
    token: string;
    owner_user_id: string;
    payload: string;
    battle_key: string;
    turn_version: number;
    expires_at: string;
    updated_at: string;
  }>
): Promise<boolean> {
  if (rows.length === 0) {
    return true;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from('game_sessions').insert(rows);
  if (!error) {
    return true;
  }

  console.error('[db] insert game sessions failed:', error.message);
  return false;
}

async function createTokenMapForBattle(ownerUserId: string, battleKey: string, payloads: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (payloads.length === 0) {
    return map;
  }

  const turnVersion = await reserveNextTurnVersion(ownerUserId, battleKey);
  const expiresAt = nowMs() + SESSION_TTL_MS;
  const updatedAt = toIso(nowMs());

  let rows = payloads.map(payload => ({
    token: randomToken(TOKEN_SIZE),
    owner_user_id: ownerUserId,
    payload,
    battle_key: battleKey,
    turn_version: turnVersion,
    expires_at: toIso(expiresAt),
    updated_at: updatedAt,
  }));

  const inserted = await insertSessionRows(rows);
  if (!inserted) {
    rows = payloads.map(payload => ({
      token: randomToken(TOKEN_SIZE),
      owner_user_id: ownerUserId,
      payload,
      battle_key: battleKey,
      turn_version: turnVersion,
      expires_at: toIso(expiresAt),
      updated_at: updatedAt,
    }));
    await insertSessionRows(rows);
  }

  for (const row of rows) {
    const entry: SessionEntry = {
      token: row.token,
      payload: row.payload,
      ownerUserId,
      battleKey,
      turnVersion,
      expiresAt,
    };

    tokenToSession.set(row.token, entry);
    map.set(row.payload, row.token);
  }

  return map;
}

type PendingEncoding = {
  ownerUserId: string;
  battleKey: string;
  payloads: Set<string>;
};

export async function encodeGameplayButtons(buttons: RawButton[]): Promise<RawButton[]> {
  await pruneExpiredSessions();

  const groups = new Map<string, PendingEncoding>();

  for (const row of buttons) {
    for (const component of row.components) {
      if (!hasCustomId(component)) {
        continue;
      }

      const { payload, owner } = parseCustomId(component.custom_id);
      if (!needsEncoding(payload)) {
        continue;
      }

      const ownerUserId = owner || 'all';
      const battleKey = extractBattleKeyFromPayload(payload);
      const key = `${ownerUserId}::${battleKey}`;

      if (!groups.has(key)) {
        groups.set(key, {
          ownerUserId,
          battleKey,
          payloads: new Set<string>(),
        });
      }

      groups.get(key)?.payloads.add(payload);
    }
  }

  const tokenMaps = new Map<string, Map<string, string>>();
  for (const [key, group] of groups.entries()) {
    const map = await createTokenMapForBattle(group.ownerUserId, group.battleKey, [...group.payloads]);
    tokenMaps.set(key, map);
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

      const ownerUserId = owner || 'all';
      const battleKey = extractBattleKeyFromPayload(payload);
      const map = tokenMaps.get(`${ownerUserId}::${battleKey}`);
      const token = map?.get(payload);
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

async function loadTokenRowByToken(token: string): Promise<SessionEntry | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase || !token) {
    return null;
  }

  const { data, error } = await supabase.from('game_sessions').select('token, payload, owner_user_id, battle_key, turn_version, expires_at').eq('token', token).maybeSingle();

  if (error) {
    console.error('[db] load game session by token failed:', error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  const entry = buildSessionEntry(data as SessionTokenRow);
  tokenToSession.set(token, entry);
  latestTurnByBattle.set(battleCacheKey(entry.ownerUserId, entry.battleKey), Math.max(latestTurnByBattle.get(battleCacheKey(entry.ownerUserId, entry.battleKey)) || 1, entry.turnVersion));
  return entry;
}

export async function decodeGameplayPayloadWithStatus(encodedPayload: string, userID: string): Promise<DecodeGameplayPayloadResult> {
  await pruneExpiredSessions();

  if (!encodedPayload.startsWith(TOKEN_PREFIX)) {
    return { payload: encodedPayload };
  }

  const token = encodedPayload.slice(TOKEN_PREFIX.length);
  if (!token) {
    return { payload: null, reason: 'invalid-token' };
  }

  const cached = tokenToSession.get(token) || null;
  const entry = cached || (await loadTokenRowByToken(token));
  if (!entry) {
    return { payload: null, reason: 'not-found' };
  }

  if (entry.ownerUserId !== userID && entry.ownerUserId !== 'all') {
    return { payload: null, reason: 'forbidden' };
  }

  if (isExpired(entry)) {
    return { payload: null, reason: 'expired' };
  }

  const latestTurn = await getLatestTurnVersion(entry.ownerUserId, entry.battleKey);
  if (entry.turnVersion !== latestTurn) {
    return { payload: null, reason: 'stale' };
  }

  return { payload: entry.payload };
}

export async function decodeGameplayPayload(encodedPayload: string, userID: string): Promise<string | null> {
  const result = await decodeGameplayPayloadWithStatus(encodedPayload, userID);
  return result.payload;
}
