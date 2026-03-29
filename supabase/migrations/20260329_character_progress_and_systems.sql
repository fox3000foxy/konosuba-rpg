-- Character progression + inventory/crafting foundations

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

-- Backfill: create 3 character rows for every existing player.
insert into public.character_progress (user_id, character_key, xp, level, affinity)
select p.user_id, c.character_key, 0, 1, 0
from public.players p
cross join (
  values ('darkness'), ('aqua'), ('megumin')
) as c(character_key)
on conflict (user_id, character_key) do nothing;

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
