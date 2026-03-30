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

create table if not exists public.character_progress (
  user_id text not null references public.players(user_id) on delete cascade,
  character_key text not null,
  xp integer not null default 0,
  level integer not null default 1,
  affinity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, character_key),
  constraint character_progress_character_key_check
    check (character_key in ('darkness', 'aqua', 'megumin')),
  constraint character_progress_xp_nonnegative check (xp >= 0),
  constraint character_progress_level_min check (level >= 1),
  constraint character_progress_affinity_nonnegative check (affinity >= 0)
);

create index if not exists character_progress_user_id_idx
  on public.character_progress(user_id);

create table if not exists public.inventory_items (
  user_id text not null references public.players(user_id) on delete cascade,
  item_key text not null,
  item_type text not null default 'component',
  quantity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_key),
  constraint inventory_items_quantity_nonnegative check (quantity >= 0),
  constraint inventory_items_item_type_check
    check (item_type in ('affinity', 'component', 'potion', 'misc'))
);

create index if not exists inventory_items_user_id_idx
  on public.inventory_items(user_id);

create table if not exists public.crafting_recipes (
  recipe_key text primary key,
  result_item_key text not null,
  result_quantity integer not null default 1,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crafting_recipes_result_quantity_positive check (result_quantity > 0)
);

create table if not exists public.crafting_recipe_ingredients (
  recipe_key text not null references public.crafting_recipes(recipe_key) on delete cascade,
  ingredient_item_key text not null,
  required_quantity integer not null,
  primary key (recipe_key, ingredient_item_key),
  constraint crafting_recipe_ingredients_required_quantity_positive
    check (required_quantity > 0)
);

create table if not exists public.player_potions (
  user_id text not null references public.players(user_id) on delete cascade,
  potion_key text not null,
  quantity integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, potion_key),
  constraint player_potions_quantity_nonnegative check (quantity >= 0)
);

create index if not exists player_potions_user_id_idx
  on public.player_potions(user_id);

create table if not exists public.game_sessions (
  token text primary key,
  owner_user_id text not null,
  payload text not null,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists game_sessions_updated_at_idx
  on public.game_sessions(updated_at desc);

create unique index if not exists game_sessions_owner_payload_uidx
  on public.game_sessions(owner_user_id, payload);
