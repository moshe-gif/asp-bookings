-- 0100: a daily cap on AI use (2026-11-12 audit #13.3). Every AI feature (inbox reading, lead auto-fill, gig
-- sheets, travel documents, venue lookup) now takes one call from its own daily allowance before it calls the
-- model, and records the tokens the call used. A loop, a stuck retry or a misbehaving page stops at the cap for
-- the rest of the day (New York time) instead of draining the AI account. Normal use is far below the caps
-- (the inbox reads ~15 emails a day). Service role only. Applied: (run by supabase/run-sql.sh)

begin;
create table if not exists public.ai_usage (
  day date not null,
  feature text not null,
  calls int not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  primary key (day, feature)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Takes one call from today's allowance; false when the cap is reached. Atomic (one row per day+feature).
create or replace function public.ai_take(p_feature text, p_cap int)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_day date := (now() at time zone 'America/New_York')::date; v_n int;
begin
  insert into ai_usage (day, feature, calls) values (v_day, p_feature, 1)
  on conflict (day, feature) do update set calls = ai_usage.calls + 1 where ai_usage.calls < p_cap
  returning calls into v_n;
  return v_n is not null;
end $$;

create or replace function public.ai_record(p_feature text, p_in bigint, p_out bigint)
returns void language sql security definer set search_path = public as $$
  update ai_usage set input_tokens = input_tokens + greatest(coalesce(p_in, 0), 0), output_tokens = output_tokens + greatest(coalesce(p_out, 0), 0)
   where day = (now() at time zone 'America/New_York')::date and feature = p_feature;
$$;

revoke all on function public.ai_take(text, int) from public, anon, authenticated;
revoke all on function public.ai_record(text, bigint, bigint) from public, anon, authenticated;
grant execute on function public.ai_take(text, int) to service_role;
grant execute on function public.ai_record(text, bigint, bigint) to service_role;
commit;
