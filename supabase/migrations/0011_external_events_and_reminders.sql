-- External Events (item 1): a first-class model for non-ASP-managed events, expanding what
-- outside_bookings (0001) covered. outside_bookings was bookkeeping-oriented (performer name,
-- total/ASP cut, no reminders/travel/timezone) -- this table is the fuller model the spec asks
-- for. Existing outside_bookings rows/table are NOT dropped or altered here; the import tool
-- (Phase 1, migration/import tooling) copies them in preserving their id as legacy_outside_booking_id
-- so nothing already recorded is lost and old references still resolve.
create table external_events (
  id uuid primary key default gen_random_uuid(),
  legacy_outside_booking_id uuid references outside_bookings(id),
  performer_artist_id uuid references artists(id), -- set when the performer is an ASP artist
  performer_name text, -- free text when the performer is NOT an ASP artist
  performer_contact text default '',
  event_name text not null,
  event_type text default '',
  date date not null,
  start_time text,
  end_time text,
  timezone text default 'America/New_York',
  venue text default '',
  address text default '',
  city text default '',
  state text default '',
  client_name text default '',
  client_email text default '',
  client_phone text default '',
  notes text default '',
  source text default '',
  status text not null default 'open',
  -- Deliberately separate from the ASP main calendar -- "Do not put an external event on ASP's
  -- main booking calendar unless the user explicitly selects that option" (item 1).
  show_on_asp_calendar boolean not null default false,
  flight_needed boolean not null default false,
  flight_booked boolean not null default false,
  flight jsonb,
  ground_transport_needed boolean not null default false,
  ground_transport_booked boolean not null default false,
  ground_transport jsonb,
  hotel jsonb,
  total_amount numeric,
  asp_cut numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table external_events enable row level security;
create policy "admin manages external events" on external_events for all using (is_admin()) with check (is_admin());
create policy "artist sees own external events" on external_events for select using (performer_artist_id = current_artist_id());

-- Generic reminders, polymorphic across whichever entity needs one (event, external_event, travel
-- request, invoice balance follow-up) rather than a bespoke reminder table per entity type --
-- matches how activity_log (0001) already does polymorphic entity_type/entity_id.
create table reminders (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('event','external_event','travel_request','contract','invoice')),
  entity_id uuid not null,
  kind text not null default 'general', -- e.g. 'balance_followup', 'deposit_followup', 'travel_followup'
  due_at timestamptz not null,
  owner uuid references admin_users(id),
  recurrence_days int, -- null = one-time; otherwise re-fires every N days until completed
  completed_at timestamptz,
  snoozed_until timestamptz,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table reminders enable row level security;
create policy "admin manages reminders" on reminders for all using (is_admin()) with check (is_admin());

-- Extend the existing activity_log (0001) with the new entity types this build introduces, rather
-- than creating a parallel audit table -- "reuse... activity logs" per the spec's own instruction,
-- and this is the one already-immutable, already-RLS'd mechanism in the app.
alter table activity_log drop constraint if exists activity_log_entity_type_check;
alter table activity_log add constraint activity_log_entity_type_check
  check (entity_type in ('event','project','invoice','outside_booking','external_event','contract','travel_request','payment','calendar_link','zelle_notification','integration'));
