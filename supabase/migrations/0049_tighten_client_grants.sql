-- Audit 1.4 (blanket grants), safe slice. The browser roles (anon, authenticated) held TRUNCATE,
-- TRIGGER and REFERENCES on nearly every table. TRUNCATE in particular ignores row-level security,
-- so RLS was not actually the barrier for it. Nothing in the app uses any of the three (PostgREST
-- never issues them), so revoking them changes no behavior.
-- Also: the artist views are read-only (not updatable), so authenticated keeps SELECT only there;
-- and the server-only token tables (Edge Functions via service role) lose every browser grant.
-- Table-by-table DML revokes for authenticated are NOT done here (they can break reads; audit 1.4).
-- Applied: 2026-10-12 (Management API).

do $$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('r','v','m','p')
  loop
    execute format('revoke truncate, trigger, references on public.%I from anon, authenticated', t.relname);
  end loop;
end $$;

revoke insert, update, delete on public.artist_gig_view, public.artist_finance_view from anon, authenticated;
revoke all on public.gcal_connection, public.gmail_oauth_tokens, public.oauth_states, public.qbo_connection
  from anon, authenticated;

-- Future tables: don't hand these out by default either.
alter default privileges for role postgres in schema public
  revoke truncate, trigger, references on tables from anon, authenticated;
