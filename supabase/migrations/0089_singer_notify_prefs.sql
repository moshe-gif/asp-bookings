-- 0089: a singer's own message choices, kept on the server so the sends follow them (owner 2026-11-10: "we should
-- add a whatsapp option" -- the Settings switches were only saved in the phone and changed nothing).
-- artists.notify: { weeklyEmail, dayOfWhatsApp, flightWhatsApp } -- missing = on. client-followups reads it.
-- A singer reads / changes only their own, through the two functions below (no direct table access).
--
-- Applied: 2026-11-10 (supabase/run-sql.sh)

begin;
alter table public.artists add column if not exists notify jsonb not null default '{}'::jsonb;

create or replace function public.my_notify() returns jsonb
  language sql stable security definer set search_path = public
  as $$ select coalesce((select notify from artists where id = current_artist_id()), '{}'::jsonb) $$;

create or replace function public.set_my_notify(p jsonb) returns jsonb
  language plpgsql security definer set search_path = public
  as $$
declare me uuid := current_artist_id(); clean jsonb := '{}'::jsonb; k text;
begin
  if me is null then raise exception 'not a singer'; end if;
  foreach k in array array['weeklyEmail', 'dayOfWhatsApp', 'flightWhatsApp'] loop
    if p ? k and jsonb_typeof(p -> k) = 'boolean' then clean := clean || jsonb_build_object(k, p -> k); end if;
  end loop;
  update artists set notify = notify || clean where id = me;
  return (select notify from artists where id = me);
end $$;

revoke execute on function public.my_notify(), public.set_my_notify(jsonb) from public, anon;
grant execute on function public.my_notify(), public.set_my_notify(jsonb) to authenticated;
commit;
