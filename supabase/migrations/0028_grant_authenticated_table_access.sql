-- Navigation/data-layer refactor, PR 16: a critical, previously-undiscovered production bug found
-- while building the real-auth test-harness fixture. Every table in the public schema is missing
-- the base Postgres GRANT to the `authenticated` role -- confirmed directly: a real, confirmed,
-- correctly roster-linked session got "permission denied for table admin_users" (Postgres error
-- 42501) on a plain select, with the exact hint "GRANT SELECT ON public.admin_users TO
-- authenticated." This is NOT an RLS problem -- Postgres checks table-level GRANTs before it ever
-- evaluates a row-level security policy, so every RLS policy already written in this schema
-- (is_admin()-gated, current_artist_id()-scoped, etc.) has been completely inert for any real
-- (non-service-role) session this whole time, on every table, not just admin_users. This explains
-- why no real end-to-end Supabase read/write path has ever actually been verified working this
-- project -- only that magic-link emails were successfully sent, never that the post-login roster
-- query (linkRealSessionToRoster, asp.js) could actually complete.
--
-- Fix: grant schema usage + the standard CRUD privilege set to `authenticated` only (this app has
-- no unauthenticated/public-read surface -- every existing RLS policy already requires
-- auth.uid() is not null at minimum, so there's no legitimate anon use case to grant). This does
-- not loosen security beyond what was already designed and written: RLS is what actually
-- restricts which ROWS a query can see/touch, and every policy in migrations 0001-0026 already
-- assumes this grant exists. Default privileges are set too, so a future `create table` in this
-- schema doesn't silently reproduce the same bug.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
