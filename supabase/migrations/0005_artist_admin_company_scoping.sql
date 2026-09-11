-- Company-scope the two identity tables that carry REAL, LIVE data today (artists, admin_users
-- back real Supabase auth right now -- events/projects/etc. are still localStorage-only, per
-- AUDIT.md category D, so scoping them waits for the Phase 2 wave that actually moves each
-- collection onto Supabase; adding company_id to inert tables today would just be unverified
-- surface area against a live database for no present benefit).
--
-- Without this, "read roster"/"read office list" (0001) let ANY signed-in user read the WHOLE
-- artists/admin_users table regardless of company -- harmless while only ASP has real members,
-- but a real cross-company leak the moment a VOX-only member exists. Tighten both to company
-- membership.

alter table artists add column company_id uuid references companies(id);
update artists set company_id = (select id from companies where slug = 'asp') where company_id is null;
alter table artists alter column company_id set not null;

alter table admin_users add column company_id uuid references companies(id);
update admin_users set company_id = (select id from companies where slug = 'asp') where company_id is null;
alter table admin_users alter column company_id set not null;

drop policy "read roster" on artists;
create policy "read roster" on artists for select using (
  company_id in (select current_company_ids())
);
drop policy "admin manages roster" on artists;
create policy "admin manages roster" on artists for all using (
  is_admin() and company_id in (select current_company_ids())
) with check (
  is_admin() and company_id in (select current_company_ids())
);

drop policy "read office list" on admin_users;
create policy "read office list" on admin_users for select using (
  company_id in (select current_company_ids())
);
drop policy "admin manages office list" on admin_users;
create policy "admin manages office list" on admin_users for all using (
  is_admin() and company_id in (select current_company_ids())
) with check (
  is_admin() and company_id in (select current_company_ids())
);
