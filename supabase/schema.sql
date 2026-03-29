create table if not exists public.players (
  user_id text primary key,
  level integer not null default 1,
  xp integer not null default 0,
  gold integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.runs (
  id bigint generated always as identity primary key,
  run_key text not null unique,
  user_id text not null references public.players(user_id) on delete cascade,
  state text not null,
  training boolean not null default false,
  monster_name text,
  actions_count integer not null default 0,
  completed_at timestamptz not null default now()
);

create index if not exists runs_user_id_idx on public.runs(user_id);
create index if not exists runs_completed_at_idx on public.runs(completed_at desc);

create table if not exists public.achievements_unlocked (
  user_id text not null references public.players(user_id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_key)
);

create table if not exists public.daily_quests_progress (
  user_id text not null references public.players(user_id) on delete cascade,
  quest_day date not null,
  quest_key text not null,
  progress integer not null default 0,
  claimed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, quest_day, quest_key)
);
