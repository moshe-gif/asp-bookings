-- Zelle matching from artist mailboxes (item 6) + centralized brand config (item 9).

create table gmail_mailboxes (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references integration_connections(id),
  mailbox_type text not null check (mailbox_type in ('artist_payment','asp_sending')),
  artist_id uuid references artists(id),
  email text not null unique,
  watch_expires_at timestamptz,
  last_history_id text, -- Gmail History API cursor for incremental sync after a watch renewal
  created_at timestamptz not null default now()
);
alter table gmail_mailboxes enable row level security;
create policy "admin manages gmail mailboxes" on gmail_mailboxes for all using (is_admin()) with check (is_admin());

-- "Never discard an unmatched payment notification" -- every parsed notice gets a row here
-- regardless of match outcome; status tracks where it landed. Minimal stored content per item 6
-- ("minimize stored email content") -- amount/sender/memo/timestamp only, not the full message body.
create table zelle_notifications (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid references gmail_mailboxes(id),
  gmail_message_id text not null unique,
  bank_transaction_ref text,
  amount numeric,
  sender_name text,
  memo text,
  received_at timestamptz not null,
  status text not null default 'unmatched' check (status in ('unmatched','auto_matched','reviewed','rejected')),
  matched_event_id uuid references events(id),
  matched_external_event_id uuid references external_events(id),
  match_score numeric,
  match_reasons jsonb not null default '[]'::jsonb,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index zelle_notifications_bank_ref_uniq on zelle_notifications (bank_transaction_ref) where bank_transaction_ref is not null;
alter table zelle_notifications enable row level security;
create policy "admin manages zelle notifications" on zelle_notifications for all using (is_admin()) with check (is_admin());

-- One centralized brand config table instead of scattered hardcoded branding (item 9) -- reused by
-- contracts, invoices, confirmations, calendar descriptions, travel requests, itineraries, flight
-- updates, and every outgoing email template. Readable by any signed-in user (every screen/email
-- render needs it), writable by admins only. Seeded to match the app's existing DOC_BRANDS
-- constant (frontend/workspaces/asp.js) so nothing changes visually until an admin edits it here.
create table brand_config (
  id uuid primary key default gen_random_uuid(),
  brand_key text not null unique check (brand_key in ('asp','sing')),
  is_default boolean not null default false,
  legal_name text not null,
  display_name text not null,
  logo_url text,
  colors jsonb not null default '{}'::jsonb,
  typography jsonb not null default '{}'::jsonb,
  sender_name text,
  reply_to text,
  footer_text text default '',
  website text default '',
  phone text default '',
  email text default '',
  address text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table brand_config enable row level security;
create policy "read brand config" on brand_config for select using (auth.uid() is not null);
create policy "admin manages brand config" on brand_config for all using (is_admin()) with check (is_admin());

insert into brand_config (brand_key, is_default, legal_name, display_name, sender_name, reply_to, footer_text)
values
  ('asp', true, 'ASP Management Services LLC', 'ASP Artist Management', 'ASP Management', 'billing@aspmgmt.com', ''),
  ('sing', false, 'SING Entertainment', 'SING Entertainment', 'SING Entertainment', '', '');
