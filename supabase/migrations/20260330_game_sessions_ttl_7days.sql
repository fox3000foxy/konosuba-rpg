-- Relax game session expiration default to reduce mid-run invalidation

alter table if exists public.game_sessions
  alter column expires_at set default (now() + interval '7 days');

update public.game_sessions
set expires_at = now() + interval '7 days'
where expires_at < now() + interval '24 hours';
