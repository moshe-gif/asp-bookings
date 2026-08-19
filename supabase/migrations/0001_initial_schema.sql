-- ASP Bookings — initial schema migration
-- Tables created empty, RLS enabled from creation (never "on later").
-- Design notes:
--   * Nested arrays that get summed/queried (charges, financial line items, tasks) get their
--     own table with a FK back to the parent, per BACKEND_SETUP.md step 1.
--   * Single nested objects that are never queried independently (event.flight,
--     event.groundTransport) stay as jsonb columns — normalizing a 1:1 optional object into its
--     own table buys nothing here.
--   * artist_id / user linkage: `artists.user_id` and `admin_users.user_id` point at
--     `auth.users.id` once each person has actually signed in via passkey. Nullable until then
--     (an artist can exist on the roster before their first login — that's the real workflow:
--     office adds them, they sign in later).

-- ============ IDENTITY ============

create table artists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique,
  name text not null,
  slot int not null,
  initials text not null,
  email text not null unique,
  role text not null default 'Singer' check (role in ('Singer','Comedian','DJ')),
  created_at timestamptz not null default now()
);
alter table artists enable row level security;

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique,
  name text not null,
  email text not null unique,
  initials text not null,
  created_at timestamptz not null default now()
);
alter table admin_users enable row level security;

-- Helper functions used by every policy below — keeps RLS readable and DRY.
create or replace function is_admin() returns boolean
  language sql security definer stable as $$
    select exists(select 1 from admin_users where user_id = auth.uid());
  $$;

create or replace function current_artist_id() returns uuid
  language sql security definer stable as $$
    select id from artists where user_id = auth.uid();
  $$;

-- Identity tables: everyone signed in can read the roster/office list (needed for names/avatars
-- throughout the UI); only admins can add/edit/remove people.
create policy "read roster" on artists for select using (auth.uid() is not null);
create policy "admin manages roster" on artists for all using (is_admin()) with check (is_admin());
create policy "read office list" on admin_users for select using (auth.uid() is not null);
create policy "admin manages office list" on admin_users for all using (is_admin()) with check (is_admin());

-- ============ EVENTS (gigs / leads) ============

create table events (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id),
  type text not null,
  unpaid boolean not null default false,
  client_name text,
  client_email text,
  client_phone text,
  date date not null,
  time text not null,
  end_time text,
  venue text default '',
  city text default '',
  state text default '',
  price numeric not null default 0,
  commission numeric not null default 0,
  balance numeric not null default 0,
  status text not null default 'lead',
  deposit_received boolean not null default false,
  deposit_received_date date,
  balance_received boolean not null default false,
  balance_received_date date,
  reminder_interval_days int,
  last_reminder_sent date,
  flight_needed boolean not null default false,
  flight_booked boolean not null default false,
  flight jsonb,
  ground_transport_needed boolean not null default false,
  ground_transport_booked boolean not null default false,
  ground_transport jsonb,
  dress_code text default '',
  artist_paid_out boolean not null default false,
  artist_paid_out_date date,
  intl_opportunity_dismissed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table events enable row level security;

create policy "admin sees all events" on events for select using (is_admin());
create policy "artist sees own events" on events for select using (artist_id = current_artist_id());
create policy "admin manages events" on events for insert with check (is_admin());
create policy "admin updates events" on events for update using (is_admin()) with check (is_admin());
-- Artists can update a narrow set of their own event fields (block time, self-created unavailable
-- days) — enforced at the application layer for now; revisit with a column-level policy or a
-- dedicated RPC if artist self-service grows beyond blocking time.
create policy "artist updates own events" on events for update using (artist_id = current_artist_id()) with check (artist_id = current_artist_id());
create policy "admin deletes events" on events for delete using (is_admin());
create policy "artist deletes own events" on events for delete using (artist_id = current_artist_id());

create table event_charges (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  label text not null,
  amount numeric not null,
  added_after_signing boolean not null default false
);
alter table event_charges enable row level security;
create policy "see charges via parent event" on event_charges for select using (
  exists(select 1 from events e where e.id = event_id and (is_admin() or e.artist_id = current_artist_id()))
);
create policy "admin manages charges" on event_charges for all using (is_admin()) with check (is_admin());

create table event_prep_sheets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  -- demo-era data URLs; swap for a Supabase Storage object path once real files are wired.
  data_url text,
  uploaded_at timestamptz not null default now()
);
alter table event_prep_sheets enable row level security;
create policy "see prep sheets via parent event" on event_prep_sheets for select using (
  exists(select 1 from events e where e.id = event_id and (is_admin() or e.artist_id = current_artist_id()))
);
create policy "admin manages prep sheets" on event_prep_sheets for all using (is_admin()) with check (is_admin());

-- ============ PROJECT TYPES (templates) ============

create table project_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  stages text[] not null,
  recurring boolean not null default false,
  batch_with_recording_day boolean not null default false,
  suggested_roles text[] default '{}',
  created_at timestamptz not null default now()
);
alter table project_types enable row level security;
create policy "read project types" on project_types for select using (auth.uid() is not null);
create policy "admin manages project types" on project_types for all using (is_admin()) with check (is_admin());

create table project_type_checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_type_id uuid not null references project_types(id) on delete cascade,
  stage text not null,
  item_text text not null,
  sort_order int not null default 0
);
alter table project_type_checklist_items enable row level security;
create policy "read checklist templates" on project_type_checklist_items for select using (auth.uid() is not null);
create policy "admin manages checklist templates" on project_type_checklist_items for all using (is_admin()) with check (is_admin());

-- ============ PROJECTS ============

create table projects (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id),
  type text not null references project_types(name),
  title text not null,
  subtitle text default '',
  stage text not null,
  due_date date,
  recording_event_id uuid references events(id),
  created_at timestamptz not null default now()
);
alter table projects enable row level security;
create policy "admin sees all projects" on projects for select using (is_admin());
create policy "artist sees own projects" on projects for select using (artist_id = current_artist_id());
create policy "admin manages projects" on projects for insert with check (is_admin());
create policy "admin updates projects" on projects for update using (is_admin()) with check (is_admin());

create table project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  stage text not null,
  text text not null,
  done boolean not null default false
);
alter table project_tasks enable row level security;
create policy "see tasks via parent project" on project_tasks for select using (
  exists(select 1 from projects p where p.id = project_id and (is_admin() or p.artist_id = current_artist_id()))
);
create policy "admin manages tasks" on project_tasks for all using (is_admin()) with check (is_admin());
-- Both roles can toggle a task done — matches the mock app (no isAdmin gate on toggle-task).
create policy "toggle own project tasks" on project_tasks for update using (
  exists(select 1 from projects p where p.id = project_id and p.artist_id = current_artist_id())
) with check (
  exists(select 1 from projects p where p.id = project_id and p.artist_id = current_artist_id())
);

create table project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  author_id uuid not null,
  text text not null,
  ts timestamptz not null default now()
);
alter table project_comments enable row level security;
create policy "see comments via parent project" on project_comments for select using (
  exists(select 1 from projects p where p.id = project_id and (is_admin() or p.artist_id = current_artist_id()))
);
-- Conversation tab: any team member (admin or the project's own artist) can post.
create policy "post comments on own project" on project_comments for insert with check (
  exists(select 1 from projects p where p.id = project_id and (is_admin() or p.artist_id = current_artist_id()))
);

create table project_people (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  role text not null,
  name text not null
);
alter table project_people enable row level security;
create policy "see people via parent project" on project_people for select using (
  exists(select 1 from projects p where p.id = project_id and (is_admin() or p.artist_id = current_artist_id()))
);
create policy "admin manages project people" on project_people for all using (is_admin()) with check (is_admin());

create table project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  data_url text, -- demo-era; swap for Supabase Storage once real files are wired
  uploaded_at timestamptz not null default now()
);
alter table project_images enable row level security;
create policy "see images via parent project" on project_images for select using (
  exists(select 1 from projects p where p.id = project_id and (is_admin() or p.artist_id = current_artist_id()))
);
create policy "upload images on own project" on project_images for insert with check (
  exists(select 1 from projects p where p.id = project_id and (is_admin() or p.artist_id = current_artist_id()))
);
create policy "delete images on own project" on project_images for delete using (
  exists(select 1 from projects p where p.id = project_id and (is_admin() or p.artist_id = current_artist_id()))
);

create table project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  label text default '',
  url text not null
);
alter table project_links enable row level security;
create policy "see links via parent project" on project_links for select using (
  exists(select 1 from projects p where p.id = project_id and (is_admin() or p.artist_id = current_artist_id()))
);
create policy "manage links on own project" on project_links for all using (
  exists(select 1 from projects p where p.id = project_id and (is_admin() or p.artist_id = current_artist_id()))
) with check (
  exists(select 1 from projects p where p.id = project_id and (is_admin() or p.artist_id = current_artist_id()))
);

create table project_financial_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  kind text not null check (kind in ('income','expense')),
  label text not null,
  amount numeric not null
);
alter table project_financial_items enable row level security;
create policy "admin sees project financials" on project_financial_items for select using (is_admin());
create policy "admin manages project financials" on project_financial_items for all using (is_admin()) with check (is_admin());

-- ============ SHARED ACTIVITY LOG ============
-- One table for every entity's activity feed (events, projects, invoices, outside bookings)
-- instead of four near-identical tables. Placed here (after both events and projects exist)
-- since its policies reference both parent tables.

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('event','project','invoice','outside_booking')),
  entity_id uuid not null,
  ts timestamptz not null default now(),
  type text not null,
  text text not null
);
alter table activity_log enable row level security;
-- Visibility mirrors the parent entity's own policy -- simplest correct approach is to check
-- admin OR (entity is an event/project belonging to the caller's artist_id).
create policy "see log via parent event" on activity_log for select using (
  entity_type <> 'event' or exists(select 1 from events e where e.id = entity_id and (is_admin() or e.artist_id = current_artist_id()))
);
create policy "see log via parent project" on activity_log for select using (
  entity_type <> 'project' or exists(select 1 from projects p where p.id = entity_id and (is_admin() or p.artist_id = current_artist_id()))
);
create policy "admin sees all log entries" on activity_log for select using (is_admin());
create policy "admin writes log entries" on activity_log for insert with check (is_admin());
create policy "artist writes log on own entity" on activity_log for insert with check (
  (entity_type = 'event' and exists(select 1 from events e where e.id = entity_id and e.artist_id = current_artist_id()))
  or (entity_type = 'project' and exists(select 1 from projects p where p.id = entity_id and p.artist_id = current_artist_id()))
);

-- ============ CUSTOM INVOICES (non-gig billing) ============

create table custom_invoices (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_email text default '',
  notes text default '',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table custom_invoices enable row level security;
create policy "admin manages invoices" on custom_invoices for all using (is_admin()) with check (is_admin());

create table custom_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references custom_invoices(id) on delete cascade,
  label text not null,
  amount numeric not null
);
alter table custom_invoice_items enable row level security;
create policy "admin manages invoice items" on custom_invoice_items for all using (is_admin()) with check (is_admin());

-- ============ OUTSIDE BOOKINGS (non-roster jobs) ============

create table outside_bookings (
  id uuid primary key default gen_random_uuid(),
  performer_name text not null,
  performer_contact text default '',
  client_name text not null,
  client_email text default '',
  date date not null,
  venue text default '',
  city text default '',
  state text default '',
  total_amount numeric not null,
  asp_cut numeric not null,
  notes text default '',
  status text not null default 'open',
  created_at timestamptz not null default now()
);
alter table outside_bookings enable row level security;
create policy "admin manages outside bookings" on outside_bookings for all using (is_admin()) with check (is_admin());

-- ============ PRICING ============

create table pricing_rates (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id),
  event_type text not null,
  hourly_rate numeric not null default 0,
  included_hours numeric not null default 2,
  unique (artist_id, event_type)
);
alter table pricing_rates enable row level security;
create policy "admin manages pricing" on pricing_rates for all using (is_admin()) with check (is_admin());

-- ============ USER SETTINGS ============

create table user_settings (
  user_id uuid primary key references auth.users(id),
  calendar_connected boolean not null default false,
  calendar_email text default '',
  notify jsonb not null default '{}'::jsonb
);
alter table user_settings enable row level security;
create policy "read own settings" on user_settings for select using (user_id = auth.uid());
create policy "manage own settings" on user_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
