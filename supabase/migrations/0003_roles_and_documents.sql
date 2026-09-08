-- Wave 1 additions: an admin role column (needed so RLS can enforce the CEO-hidden-nav
-- restriction server-side, not just in the UI), the DOCUMENTS collection (shipped after
-- 0001/0002 were written, so missing from the schema), and dropping the vestigial
-- project_types template tables (the feature they backed was removed from the live app
-- before these migrations were ever applied to a real database).

-- ============ ADMIN ROLE ============
-- Matches the app's existing admin ids exactly (admin_bookings / admin_bookkeeping / admin_ceo)
-- so `S.user` can be set directly from this column with zero changes to the many existing
-- `S.user === 'admin_ceo'` call sites throughout frontend/index.html.
alter table admin_users add column role text not null default 'admin_bookings'
  check (role in ('admin_bookings','admin_bookkeeping','admin_ceo'));

create or replace function current_admin_role() returns text
  language sql security definer stable as $$
    select role from admin_users where user_id = auth.uid();
  $$;

-- Retrofit the CEO-hidden-nav restriction (Outside Bookings, Documents) at the RLS layer —
-- today it's UI-only (CEO_HIDDEN_NAV_VIEWS), so a CEO session could still read this data via
-- devtools/direct API calls even though the tab is hidden. Real Ilan business context: he
-- doesn't work these two areas, this isn't a hard security wall against a hostile admin.
drop policy if exists "admin manages outside bookings" on outside_bookings;
create policy "non-ceo admin manages outside bookings" on outside_bookings for all using (
  is_admin() and current_admin_role() <> 'admin_ceo'
) with check (
  is_admin() and current_admin_role() <> 'admin_ceo'
);

-- ============ DOCUMENTS ============

create table documents (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('artist','outside','general')),
  subject_id uuid, -- an artists.id or outside_bookings.id depending on subject_type; null for general
  title text not null default '',
  brand text not null default 'asp' check (brand in ('asp','sing')),
  client_name text default '',
  client_signer_title text default '',
  body_text text default '',
  created_at timestamptz not null default now(),
  signed_at timestamptz
);
alter table documents enable row level security;
create policy "non-ceo admin manages documents" on documents for all using (
  is_admin() and current_admin_role() <> 'admin_ceo'
) with check (
  is_admin() and current_admin_role() <> 'admin_ceo'
);

-- ============ DROP VESTIGIAL PROJECT_TYPES ============
-- AUDIT.md #11/#12: this template/stage-pipeline feature was removed from the live app before
-- this schema was ever applied to a real database — don't resurrect it.
alter table projects drop constraint if exists projects_type_fkey;
drop table if exists project_type_checklist_items;
drop table if exists project_types;
