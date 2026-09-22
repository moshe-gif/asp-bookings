-- Travel workflow with Rivky (item 7) + artist itinerary/flight tracking (item 8).
create table travel_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  external_event_id uuid references external_events(id),
  -- passengers, origin/destination, arrive-by/depart-after, flight class+qty, hotel prefs, ground
  -- transport, internal notes -- one jsonb blob, edited/rendered as a whole in the request form.
  details jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','sent','awaiting_reply','answered','completed')),
  sent_at timestamptz,
  gmail_thread_id text,
  gmail_message_id text,
  follow_up_at timestamptz,
  owner uuid references admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (event_id is not null or external_event_id is not null)
);
alter table travel_requests enable row level security;
create policy "admin manages travel requests" on travel_requests for all using (is_admin()) with check (is_admin());

create table itinerary_versions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  external_event_id uuid references external_events(id),
  version_number int not null,
  snapshot jsonb not null,
  rendered_html text,
  sent_at timestamptz,
  recipient text,
  provider_message_id text,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  check (event_id is not null or external_event_id is not null)
);
alter table itinerary_versions enable row level security;
create policy "admin manages itinerary versions" on itinerary_versions for all using (is_admin()) with check (is_admin());
create policy "artist sees own itinerary versions" on itinerary_versions for select using (
  exists(select 1 from events e where e.id = event_id and (e.artist_id = current_artist_id() or exists(
    select 1 from event_artists ea where ea.event_id = e.id and ea.artist_id = current_artist_id()
  )))
);

-- Confirmation codes are real booking credentials -- treated as sensitive but the traveling artist
-- still needs their own (to manage/check in), so RLS scopes read access to that one artist, not
-- "admin only" outright. Never let one artist read another's segment.
create table flight_segments (
  id uuid primary key default gen_random_uuid(),
  travel_request_id uuid references travel_requests(id),
  event_id uuid references events(id),
  passenger_artist_id uuid references artists(id),
  airline text,
  flight_number text,
  confirmation_code text,
  departure_airport text,
  arrival_airport text,
  departure_at timestamptz,
  arrival_at timestamptz,
  departure_timezone text,
  arrival_timezone text,
  provider text default 'flightaware',
  provider_flight_id text,
  last_status text,
  last_status_at timestamptz,
  source_message_id text, -- Gmail message this was parsed/approved from, for the approval audit trail
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table flight_segments enable row level security;
create policy "admin manages flight segments" on flight_segments for all using (is_admin()) with check (is_admin());
create policy "artist sees own flight segments" on flight_segments for select using (passenger_artist_id = current_artist_id());

-- Raw provider status pushes, deduped by (segment, dedupe_key) so a repeated webhook/poll doesn't
-- re-notify -- "De-duplicate repeated provider updates and keep an audit trail" (item 8).
create table flight_status_events (
  id uuid primary key default gen_random_uuid(),
  flight_segment_id uuid not null references flight_segments(id) on delete cascade,
  status text not null,
  detail jsonb not null default '{}'::jsonb,
  dedupe_key text not null,
  received_at timestamptz not null default now(),
  notified boolean not null default false,
  unique (flight_segment_id, dedupe_key)
);
alter table flight_status_events enable row level security;
create policy "admin manages flight status events" on flight_status_events for all using (is_admin()) with check (is_admin());
