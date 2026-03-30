-- Button payload sessions for short Discord custom_id values

create table if not exists public.game_sessions (
  token text primary key,
  owner_user_id text not null,
  payload text not null,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.game_sessions
  add column if not exists owner_user_id text;

alter table if exists public.game_sessions
  add column if not exists expires_at timestamptz;

update public.game_sessions
set owner_user_id = coalesce(owner_user_id, 'all')
where owner_user_id is null;

update public.game_sessions
set expires_at = coalesce(expires_at, now() + interval '24 hours')
where expires_at is null;

alter table if exists public.game_sessions
  alter column owner_user_id set not null;

alter table if exists public.game_sessions
  alter column payload set not null;

alter table if exists public.game_sessions
  alter column expires_at set not null;

alter table if exists public.game_sessions
  drop constraint if exists game_sessions_pkey;

alter table if exists public.game_sessions
  add constraint game_sessions_pkey primary key (token);

create index if not exists game_sessions_updated_at_idx
  on public.game_sessions(updated_at desc);

create unique index if not exists game_sessions_owner_payload_uidx
  on public.game_sessions(owner_user_id, payload);
