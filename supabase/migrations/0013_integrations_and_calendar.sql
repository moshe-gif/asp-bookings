-- Generic integration connection registry -- one row per OAuth-connected account (ASP's Google
-- Calendar, each artist's Gmail mailbox, the ASP sending mailbox, QuickBooks, FlightAware),
-- surfaced on the Integrations/Automation dashboard the spec asks for. Deliberately holds NO
-- secrets or tokens -- those stay in a dedicated table per integration (see qbo_connection, 0009,
-- which predates and is the pattern for this) or as Edge Function secrets, matching "keep OAuth
-- refresh tokens and API secrets encrypted server-side... never in the frontend bundle."
create table integration_connections (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('google_calendar','gmail','quickbooks','flightaware','email_delivery')),
  account_label text not null, -- e.g. "ASP Main Calendar", "Eli Marcus Gmail", "ASP QuickBooks"
  artist_id uuid references artists(id), -- set when this connection belongs to one artist's mailbox/calendar
  status text not null default 'not_connected' check (status in ('not_connected','connected','needs_attention','error')),
  health jsonb not null default '{}'::jsonb, -- last error, watch-expiry countdown, etc., for the dashboard
  last_sync_at timestamptz,
  config jsonb not null default '{}'::jsonb, -- non-secret config only (calendar id, mailbox address, poll cadence)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table integration_connections enable row level security;
create policy "admin manages integration connections" on integration_connections for all using (is_admin()) with check (is_admin());

-- One row per calendar copy of an event -- the ASP main calendar's copy AND each artist's copy are
-- separate rows, per item 4: "Store the Google Calendar account, calendar ID, and event ID for
-- every created copy. Updates must target those exact events, never search by title alone."
create table calendar_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  external_event_id uuid references external_events(id),
  calendar_role text not null check (calendar_role in ('asp_main','artist')),
  artist_id uuid references artists(id),
  connection_id uuid references integration_connections(id),
  google_calendar_id text not null,
  google_event_id text not null,
  calendar_status text not null default 'hold' check (calendar_status in ('hold','confirmed')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (google_calendar_id, google_event_id),
  check (event_id is not null or external_event_id is not null)
);
alter table calendar_links enable row level security;
create policy "admin manages calendar links" on calendar_links for all using (is_admin()) with check (is_admin());

-- Email deliveries (item 9's "Include stable template/version identifiers in logs" + every send
-- step across contracts/invoices/confirmations/itineraries/travel/flight-updates) -- one audit-
-- friendly table for every outbound email this build sends, regardless of which workflow sent it.
create table email_deliveries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contract','invoice','confirmation','itinerary','travel_request','travel_followup','flight_update','other')),
  template_id text not null,
  template_version text not null,
  entity_type text, -- 'event' | 'external_event' | 'contract' | 'travel_request', for lookup
  entity_id uuid,
  recipient text not null,
  subject text not null,
  provider_message_id text,
  gmail_thread_id text,
  status text not null default 'sent' check (status in ('sent','failed','bounced')),
  error text,
  sent_at timestamptz not null default now(),
  sent_by uuid references auth.users(id)
);
alter table email_deliveries enable row level security;
create policy "admin manages email deliveries" on email_deliveries for all using (is_admin()) with check (is_admin());
