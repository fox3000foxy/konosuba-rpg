-- Cleanup helper for expired game sessions

create or replace function public.prune_expired_game_sessions()
returns integer
language plpgsql
as $$
declare
  deleted_count integer;
begin
  delete from public.game_sessions
  where expires_at < now();

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
