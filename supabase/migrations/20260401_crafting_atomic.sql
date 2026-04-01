-- Seed initial crafting recipes for component -> potion loop.
insert into public.crafting_recipes (recipe_key, result_item_key, result_quantity, enabled)
values
  ('potion_fire_basic', '20001000', 1, true),
  ('potion_water_basic', '20001001', 1, true),
  ('potion_earth_basic', '20001002', 1, true)
on conflict (recipe_key) do update
set result_item_key = excluded.result_item_key,
    result_quantity = excluded.result_quantity,
    enabled = excluded.enabled,
    updated_at = now();

insert into public.crafting_recipe_ingredients (recipe_key, ingredient_item_key, required_quantity)
values
  ('potion_fire_basic', '20003000', 1),
  ('potion_fire_basic', '20004001', 1),
  ('potion_water_basic', '20003001', 1),
  ('potion_water_basic', '20004002', 1),
  ('potion_earth_basic', '20003002', 1),
  ('potion_earth_basic', '20004003', 1)
on conflict (recipe_key, ingredient_item_key) do update
set required_quantity = excluded.required_quantity;

create or replace function public.craft_recipe_atomic(
  p_user_id text,
  p_recipe_key text
)
returns table (
  success boolean,
  reason text,
  crafted_item_key text,
  crafted_quantity integer,
  missing_ingredients jsonb
)
language plpgsql
as $$
declare
  ingredient_row record;
  inventory_qty integer;
  recipe_result_item_key text;
  recipe_result_quantity integer;
  recipe_enabled boolean;
  missing_items jsonb := '[]'::jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('craft:' || p_user_id));

  select result_item_key, result_quantity, enabled
  into recipe_result_item_key, recipe_result_quantity, recipe_enabled
  from public.crafting_recipes
  where recipe_key = p_recipe_key;

  if not found then
    return query select false, 'recipe_not_found', null::text, 0, null::jsonb;
    return;
  end if;

  if recipe_enabled is not true then
    return query select false, 'recipe_disabled', null::text, 0, null::jsonb;
    return;
  end if;

  for ingredient_row in
    select ingredient_item_key, required_quantity
    from public.crafting_recipe_ingredients
    where recipe_key = p_recipe_key
  loop
    select quantity
    into inventory_qty
    from public.inventory_items
    where user_id = p_user_id
      and item_key = ingredient_row.ingredient_item_key
    for update;

    if coalesce(inventory_qty, 0) < ingredient_row.required_quantity then
      missing_items := missing_items || jsonb_build_object(
        'item_key', ingredient_row.ingredient_item_key,
        'required', ingredient_row.required_quantity,
        'available', coalesce(inventory_qty, 0)
      );
    end if;
  end loop;

  if jsonb_array_length(missing_items) > 0 then
    return query select false, 'insufficient_ingredients', null::text, 0, missing_items;
    return;
  end if;

  for ingredient_row in
    select ingredient_item_key, required_quantity
    from public.crafting_recipe_ingredients
    where recipe_key = p_recipe_key
  loop
    update public.inventory_items
    set quantity = quantity - ingredient_row.required_quantity,
        updated_at = now()
    where user_id = p_user_id
      and item_key = ingredient_row.ingredient_item_key;

    delete from public.inventory_items
    where user_id = p_user_id
      and item_key = ingredient_row.ingredient_item_key
      and quantity <= 0;
  end loop;

  insert into public.inventory_items (
    user_id,
    item_key,
    item_type,
    quantity,
    updated_at
  )
  values (
    p_user_id,
    recipe_result_item_key,
    'potion',
    recipe_result_quantity,
    now()
  )
  on conflict (user_id, item_key)
  do update set
    item_type = excluded.item_type,
    quantity = public.inventory_items.quantity + excluded.quantity,
    updated_at = now();

  return query
  select true, 'crafted', recipe_result_item_key, recipe_result_quantity, null::jsonb;
exception
  when others then
    return query select false, 'internal_error', null::text, 0, null::jsonb;
end;
$$;
