-- Name-only artist directory for every signed-in user (artists included). The full `artists`
-- table carries emails and commission rates, which one artist must not see about another
-- (0051 limits that table to admins + each artist's own row). Runs with the view owner's rights,
-- so it reads past RLS but exposes only these columns.
-- Applied: 2026-10-13 (Management API).

create or replace view public.artist_directory with (security_barrier) as
  select id, legacy_id, name, slot, initials, role, created_at from public.artists;

revoke all on public.artist_directory from anon, authenticated;
grant select on public.artist_directory to authenticated;
grant select on public.artist_directory to service_role;
