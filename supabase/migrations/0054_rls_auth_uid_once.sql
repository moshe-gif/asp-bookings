-- Performance advisor (auth_rls_initplan): these policies called auth.uid() once per row; wrapping it
-- in a subselect evaluates it once per query. Same rules, same results. Also drops user_settings'
-- "read own settings", which duplicated the SELECT half of "manage own settings".
-- Applied: 2026-10-13 (Management API).

alter policy "manage own settings" on public.user_settings
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "read own settings" on public.user_settings;
alter policy "read brand config" on public.brand_config using ((select auth.uid()) is not null);
alter policy "read office list" on public.admin_users using ((select auth.uid()) is not null);
alter policy "read own artist row" on public.artists using (user_id = (select auth.uid()));
