-- Company model for the parent app ("Moshe's Desk"): ASP + VOX Group workspaces.
-- Design notes:
--   * company_members is the cross-company identity/role table. It deliberately does NOT
--     reference artists/admin_users -- a person can be a company member (able to own/be
--     assigned things) without being an ASP artist or ASP office admin. Moshe and Ilan, for
--     example, are company_members of both companies without needing a matching row in either
--     of ASP's domain-specific identity tables.
--   * Same nullable-user_id-until-first-login shape as artists/admin_users (0001) and the same
--     email-match linking convention as link_new_user_to_roster() (0002): a company admin can
--     invite someone by email before they've ever signed in.
--   * current_company_ids()/is_company_admin() mirror the existing current_artist_id()/is_admin()
--     helper pattern (0001) so every future company-scoped policy stays DRY and readable.

-- ============ COMPANIES ============

create table companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  accent_hex text not null default '#64748B', -- neutral slate placeholder until a real brand color is supplied
  logo_path text default '',
  from_email text default '',
  from_name text default '',
  reply_to text default '',
  signature text default '',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table companies enable row level security;

-- ============ COMPANY MEMBERS ============

create table company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid references auth.users(id),
  email text not null,
  role text not null default 'member' check (role in ('owner','admin','member','collaborator','artist')),
  name text default '',
  created_at timestamptz not null default now(),
  unique (company_id, email)
);
alter table company_members enable row level security;

-- Helper functions -- keep every future company-scoped policy readable and DRY.
create or replace function current_company_ids() returns setof uuid
  language sql security definer stable as $$
    select company_id from company_members where user_id = auth.uid();
  $$;

create or replace function is_company_admin(cid uuid) returns boolean
  language sql security definer stable as $$
    select exists(
      select 1 from company_members
      where company_id = cid and user_id = auth.uid() and role in ('owner','admin')
    );
  $$;

-- A signed-in user reads only the companies they belong to (drives the workspace switcher --
-- it must never be able to enumerate companies the user isn't a member of).
create policy "read own companies" on companies for select using (
  id in (select current_company_ids())
);
create policy "company admin updates own company" on companies for update using (
  is_company_admin(id)
) with check (
  is_company_admin(id)
);

-- A member reads their own membership row (any company); a company admin reads/manages every
-- membership row for their own company (invite/remove people, change roles).
create policy "read own membership" on company_members for select using (
  user_id = auth.uid() or is_company_admin(company_id)
);
create policy "company admin manages members" on company_members for all using (
  is_company_admin(company_id)
) with check (
  is_company_admin(company_id)
);

-- ============ LINK INVITED MEMBERS ON FIRST REAL LOGIN ============
-- Extends (via create or replace, not editing 0002's file) the existing on_auth_user_created
-- trigger so a brand-new auth.users row also claims any company_members invite row that was
-- created ahead of time by email, same null-safe "never overwrite an existing link" guarantee.
create or replace function link_new_user_to_roster()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update admin_users set user_id = new.id where email = new.email and user_id is null;
  update artists set user_id = new.id where email = new.email and user_id is null;
  update company_members set user_id = new.id where email = new.email and user_id is null;
  return new;
end;
$$;

-- ============ SEED ============
-- ASP already exists as a going concern -- seed its company row now. VOX's row is seeded here
-- too (empty workspace) so the switcher and membership model can be exercised end-to-end before
-- Phase 6 fills in real VOX content. Accent/logo/from-address stay placeholders until supplied.
insert into companies (slug, name, accent_hex, from_email, from_name)
values ('asp', 'ASP', '#4C6FA5', 'bookings@aspmanagement.com', 'ASP Bookings')
on conflict (slug) do nothing;

insert into companies (slug, name)
values ('vox', 'The Vox Group')
on conflict (slug) do nothing;

-- Backfill every existing real admin/artist as an ASP company member, so ASP's real users are
-- never left without a membership row once company scoping goes live in 0005. Role maps
-- admin_ceo -> owner (matches Ilan's real-world authority), every other admin -> admin, every
-- artist -> artist. Idempotent (ON CONFLICT on the (company_id, email) unique key).
insert into company_members (company_id, user_id, email, role, name)
select (select id from companies where slug = 'asp'), user_id, email,
  case when role = 'admin_ceo' then 'owner' else 'admin' end, name
from admin_users
on conflict (company_id, email) do nothing;

insert into company_members (company_id, user_id, email, role, name)
select (select id from companies where slug = 'asp'), user_id, email, 'artist', name
from artists
on conflict (company_id, email) do nothing;

-- Moshe and Ilan both need VOX membership at launch (Ilan already gets it via the admin_ceo
-- backfill above once ASP is seeded -- add the VOX side for him below by the same email; Moshe
-- isn't in any existing ASP identity table, so his VOX (and future ASP) membership can only be
-- created here as an *invite* pending his first real sign-in with this email; update the email
-- below if he signs in with a different one).
insert into company_members (company_id, email, role, name)
values
  ((select id from companies where slug = 'vox'), 'ilan@aspmanagement.com', 'owner', 'Ilan'),
  ((select id from companies where slug = 'vox'), 'moishsonn@gmail.com', 'owner', 'Moshe')
on conflict (company_id, email) do nothing;
