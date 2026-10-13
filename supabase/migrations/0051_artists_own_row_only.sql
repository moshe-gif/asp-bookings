-- Artists see only their own `artists` row (emails and commission rates of other artists were
-- readable by any signed-in artist). Everyone keeps the name-only `artist_directory` (0050), which
-- the app reads for artist sessions since v1.9.1. Admins keep full access ("admin manages roster").
-- Apply only after v1.9.1 is live. Applied: 2026-10-13 (Management API).

drop policy if exists "read roster" on public.artists;
create policy "read own artist row" on public.artists for select
  using (user_id = auth.uid());
