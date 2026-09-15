-- Reverts 0004/0005: the "Moshe's Desk" single-shell-with-switcher direction was scrapped
-- (2026-09-14/15) in favor of three separate apps (ASP unchanged, Vox, Axis) connected by a
-- real sync layer instead of a shared company concept living inside ASP's own database. ASP
-- doesn't need to know about companies at all in the new architecture -- restores 0001's
-- original artists/admin_users policies and drops the now-unused tables.

drop policy if exists "read roster" on artists;
drop policy if exists "admin manages roster" on artists;
create policy "read roster" on artists for select using (auth.uid() is not null);
create policy "admin manages roster" on artists for all using (is_admin()) with check (is_admin());

drop policy if exists "read office list" on admin_users;
drop policy if exists "admin manages office list" on admin_users;
create policy "read office list" on admin_users for select using (auth.uid() is not null);
create policy "admin manages office list" on admin_users for all using (is_admin()) with check (is_admin());

alter table artists drop column if exists company_id;
alter table admin_users drop column if exists company_id;

-- Back to 0002's original body (drops the company_members line 0004 added).
create or replace function link_new_user_to_roster()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update admin_users set user_id = new.id where email = new.email and user_id is null;
  update artists set user_id = new.id where email = new.email and user_id is null;
  return new;
end;
$$;

drop table if exists company_members cascade;
drop table if exists companies cascade;
drop function if exists current_company_ids();
drop function if exists is_company_admin(uuid);
