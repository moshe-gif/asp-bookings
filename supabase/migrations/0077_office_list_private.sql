-- 0077: only office staff can read the office list (security audit 2026-11-02). Since 0054 any signed-in
-- person -- artists and crew too -- could read every admin's email, role and access flags. Now: admins see the
-- list; anyone else sees only their own row (none, for an artist or crew member). Policies elsewhere that look
-- up "is the caller an admin" still work: they only ever need the caller's own row.
--
-- Applied: 2026-11-02 (supabase/run-sql.sh)

begin;
alter policy "read office list" on public.admin_users
  using (public.is_admin() or user_id = (select auth.uid()));
commit;
