-- 0101: an AI call that fails (no credit, AI busy, network) gives its place in the daily allowance back
-- (0100). Failed calls cost nothing, and without this an out-of-credit day used up the inbox's allowance in
-- two hours, so it stayed blocked after the credit was added. Applied: (run by supabase/run-sql.sh)

begin;
create or replace function public.ai_refund(p_feature text)
returns void language sql security definer set search_path = public as $$
  update ai_usage set calls = greatest(calls - 1, 0)
   where day = (now() at time zone 'America/New_York')::date and feature = p_feature;
$$;
revoke all on function public.ai_refund(text) from public, anon, authenticated;
grant execute on function public.ai_refund(text) to service_role;
update public.ai_usage set calls = 0 where input_tokens = 0 and output_tokens = 0;   -- today's failed calls
commit;
