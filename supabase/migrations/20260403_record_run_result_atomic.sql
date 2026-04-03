create or replace function public.record_run_result_atomic(
  p_user_id text,
  p_run_key text,
  p_state text,
  p_training boolean,
  p_monster_name text,
  p_actions_count integer,
  p_completed_at timestamptz,
  p_quest_day date,
  p_play_quest_key text,
  p_play_quest_target integer,
  p_win_quest_key text,
  p_win_quest_target integer,
  p_levelup_quest_key text,
  p_levelup_quest_target integer
)
returns table (leveled_up boolean, gained_xp integer)
language plpgsql
set search_path = public
as $$
declare
  v_now timestamptz := coalesce(p_completed_at, now());
  v_current_xp integer := 0;
  v_old_level integer := 1;
  v_next_xp integer := 0;
  v_next_level integer := 1;
  v_leveled_up boolean := false;
  v_gained_xp integer := 0;
  v_is_win boolean := false;
begin
  v_is_win := p_state in ('good', 'best');

  if p_state = 'best' then
    v_gained_xp := 30;
  elsif p_state = 'good' then
    v_gained_xp := 20;
  else
    v_gained_xp := 0;
  end if;

  insert into public.players (user_id, updated_at)
  values (p_user_id, v_now)
  on conflict (user_id) do update
  set updated_at = excluded.updated_at;

  insert into public.runs (
    run_key,
    user_id,
    state,
    training,
    monster_name,
    actions_count,
    completed_at
  )
  values (
    p_run_key,
    p_user_id,
    p_state,
    p_training,
    p_monster_name,
    greatest(0, coalesce(p_actions_count, 0)),
    v_now
  )
  on conflict (run_key) do update
  set
    user_id = excluded.user_id,
    state = excluded.state,
    training = excluded.training,
    monster_name = excluded.monster_name,
    actions_count = excluded.actions_count,
    completed_at = excluded.completed_at;

  if v_gained_xp > 0 then
    select
      p.xp,
      p.level
    into
      v_current_xp,
      v_old_level
    from public.players p
    where p.user_id = p_user_id
    for update;

    v_current_xp := coalesce(v_current_xp, 0);
    v_old_level := greatest(1, coalesce(v_old_level, 1));
    v_next_xp := v_current_xp + v_gained_xp;
    v_next_level := greatest(1, floor(v_next_xp / 100.0)::int + 1);
    v_leveled_up := v_next_level > v_old_level;

    update public.players
    set
      xp = v_next_xp,
      level = v_next_level,
      updated_at = v_now
    where user_id = p_user_id;
  end if;

  if p_play_quest_key is not null and p_play_quest_target > 0 then
    insert into public.daily_quests_progress (
      user_id,
      quest_day,
      quest_key,
      progress,
      claimed,
      updated_at
    )
    values (
      p_user_id,
      p_quest_day,
      p_play_quest_key,
      1,
      false,
      v_now
    )
    on conflict (user_id, quest_day, quest_key) do update
    set
      progress = least(public.daily_quests_progress.progress + 1, p_play_quest_target),
      updated_at = v_now
    where public.daily_quests_progress.claimed = false;
  end if;

  if v_is_win and p_win_quest_key is not null and p_win_quest_target > 0 then
    insert into public.daily_quests_progress (
      user_id,
      quest_day,
      quest_key,
      progress,
      claimed,
      updated_at
    )
    values (
      p_user_id,
      p_quest_day,
      p_win_quest_key,
      1,
      false,
      v_now
    )
    on conflict (user_id, quest_day, quest_key) do update
    set
      progress = least(public.daily_quests_progress.progress + 1, p_win_quest_target),
      updated_at = v_now
    where public.daily_quests_progress.claimed = false;
  end if;

  if v_leveled_up and p_levelup_quest_key is not null and p_levelup_quest_target > 0 then
    insert into public.daily_quests_progress (
      user_id,
      quest_day,
      quest_key,
      progress,
      claimed,
      updated_at
    )
    values (
      p_user_id,
      p_quest_day,
      p_levelup_quest_key,
      1,
      false,
      v_now
    )
    on conflict (user_id, quest_day, quest_key) do update
    set
      progress = least(public.daily_quests_progress.progress + 1, p_levelup_quest_target),
      updated_at = v_now
    where public.daily_quests_progress.claimed = false;
  end if;

  return query
  select v_leveled_up, v_gained_xp;
end;
$$;
