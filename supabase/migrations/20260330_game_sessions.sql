-- Button payload sessions for short Discord custom_id values

create table if not exists public.game_sessions (
  token text primary key,
  owner_user_id text not null,
  payload text not null,
  battle_key text not null default '',
  turn_version integer not null default 1,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.game_sessions
  add column if not exists owner_user_id text;

alter table if exists public.game_sessions
  add column if not exists expires_at timestamptz;

alter table if exists public.game_sessions
  add column if not exists battle_key text;

alter table if exists public.game_sessions
  add column if not exists turn_version integer;

update public.game_sessions
set owner_user_id = coalesce(owner_user_id, 'all')
where owner_user_id is null;

update public.game_sessions
set expires_at = coalesce(expires_at, now() + interval '24 hours')
where expires_at is null;

update public.game_sessions
set battle_key = coalesce(battle_key, split_part(payload, '/', 1), payload)
where battle_key is null or battle_key = '';

update public.game_sessions
set turn_version = coalesce(turn_version, 1)
where turn_version is null;

alter table if exists public.game_sessions
  alter column owner_user_id set not null;

alter table if exists public.game_sessions
  alter column payload set not null;

alter table if exists public.game_sessions
  alter column expires_at set not null;

alter table if exists public.game_sessions
  alter column battle_key set not null;

alter table if exists public.game_sessions
  alter column turn_version set not null;

alter table if exists public.game_sessions
  drop constraint if exists game_sessions_pkey;

alter table if exists public.game_sessions
  add constraint game_sessions_pkey primary key (token);

create index if not exists game_sessions_updated_at_idx
  on public.game_sessions(updated_at desc);

drop index if exists game_sessions_owner_payload_uidx;

create index if not exists game_sessions_owner_battle_turn_idx
  on public.game_sessions(owner_user_id, battle_key, turn_version desc);
