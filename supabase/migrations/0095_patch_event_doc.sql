-- 0095: server functions change only their own fields of a gig, in one statement (2026-11-12 audit #3.1).
-- gig-form, client-pay (Zelle sent) and mercury (paid out / void) used to read the whole gig, change a few
-- keys and write the whole document back, so an office edit landing in between was silently undone.
-- patch_event_doc merges just the given top-level keys into app_doc and appends one log line, atomically.
-- Service role only. Applied: (run by supabase/run-sql.sh)

begin;

create or replace function public.patch_event_doc(p_legacy_id text, p_patch jsonb, p_log jsonb default null)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if jsonb_typeof(p_patch) is distinct from 'object' then raise exception 'patch must be an object'; end if;
  update events
     set app_doc = case when p_log is null
                        then (app_doc || (p_patch - 'log'))
                        else jsonb_set(app_doc || (p_patch - 'log'), '{log}',
                               (case when jsonb_typeof(app_doc->'log') = 'array' then app_doc->'log' else '[]'::jsonb end) || jsonb_build_array(p_log)) end
   where legacy_id = p_legacy_id and app_doc is not null;
  return found;
end $$;

revoke all on function public.patch_event_doc(text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.patch_event_doc(text, jsonb, jsonb) to service_role;

commit;
