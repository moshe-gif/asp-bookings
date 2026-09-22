-- Multi-artist events (New Artist Event workflow, item 2: "select one or more ASP artists") and
-- the payment records QuickBooks sync (item 3) needs to attach to.
--
-- events.artist_id (0001) stays as-is -- the primary/booking artist, unchanged for every existing
-- single-artist event and every place in the app that already reads it. event_artists is additive:
-- it's where a multi-artist event's full roster and PER-ARTIST money lives, which is also exactly
-- the privacy boundary the spec calls for -- "artists should see... their own fee, ASP's cut, and
-- their net, not other artists' numbers" (Reliability/permissions section). A shared events row
-- can't enforce that alone; per-artist rows with per-artist RLS can.
create table event_artists (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  artist_id uuid not null references artists(id),
  role text default 'performer',
  fee_amount numeric,
  asp_cut numeric,
  net_amount numeric,
  created_at timestamptz not null default now(),
  unique (event_id, artist_id)
);
alter table event_artists enable row level security;
create policy "admin manages event artists" on event_artists for all using (is_admin()) with check (is_admin());
create policy "artist sees own event_artists row" on event_artists for select using (artist_id = current_artist_id());

-- Lets an artist see a multi-artist event they're part of even when they're not the row's primary
-- events.artist_id -- companion to the existing "artist sees own events" policy from 0001, which
-- only matched the single primary-artist case.
create policy "artist sees events via event_artists" on events for select using (
  exists(select 1 from event_artists ea where ea.event_id = events.id and ea.artist_id = current_artist_id())
);

create table qbo_invoices (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  contract_id uuid references contracts(id),
  qbo_realm_id text,
  qbo_invoice_id text not null unique,
  qbo_customer_id text,
  doc_number text,
  amount numeric not null,
  description text default '',
  status text not null default 'sent' check (status in ('sent','partially_paid','paid','voided','overdue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table qbo_invoices enable row level security;
create policy "admin manages qbo invoices" on qbo_invoices for all using (is_admin()) with check (is_admin());

-- The single source of truth for "payment received," regardless of where the signal came from --
-- QuickBooks webhook, an auto- or reviewed-matched Zelle notice, or a manual entry. Item 3: "Never
-- mark the deposit paid solely because the contract email was sent or the invoice was created" --
-- rows here are only ever written once a real payment signal exists, never speculatively.
create table payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  external_event_id uuid references external_events(id),
  contract_id uuid references contracts(id),
  qbo_invoice_id uuid references qbo_invoices(id),
  amount numeric not null,
  kind text not null default 'deposit' check (kind in ('deposit','balance','partial','overpayment','refund','chargeback')),
  source text not null check (source in ('quickbooks','zelle_auto','zelle_reviewed','manual')),
  source_ref text, -- QuickBooks payment id, Zelle notification id, etc. -- for dedupe + audit
  status text not null default 'received' check (status in ('received','voided','refunded','disputed')),
  received_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id),
  notes text default '',
  created_at timestamptz not null default now()
);
alter table payments enable row level security;
create policy "admin manages payments" on payments for all using (is_admin()) with check (is_admin());
-- Financial detail (client's full price, QuickBooks/Zelle source refs) stays admin-only per the
-- artist-privacy rule above -- an artist's own payout visibility is event_artists.net_amount, not
-- this table directly.
