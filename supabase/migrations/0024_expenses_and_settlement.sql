-- Durable booking record architecture, PR 3 of 6, part 2 of 3. Expenses (vendor costs attributable
-- to a booking -- travel, gear rental, etc, distinct from event_artists.expenses_charged which is
-- what's netted out of one artist's own payout) and the frozen final settlement snapshot.
--
-- Live in-progress numbers (deposit received so far, running profit) are NOT stored here -- they
-- stay computed on read from payments + event_artists + booking_expenses, same "never a second
-- source of truth" reasoning as everywhere else in this schema. booking_settlements is the one
-- exception: a single immutable snapshot written once, at the `closed` transition, mirroring the
-- same versioned-snapshot pattern contract_versions already uses for contracts.

create table booking_expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  vendor_name text not null,
  category text not null check (category in ('travel','lodging','gear_rental','production','other')),
  amount_committed numeric not null,
  amount_paid numeric not null default 0,
  evidence_url text,
  evidence_note text,
  logged_by uuid not null references admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table booking_expenses enable row level security;
create policy "admin manages booking expenses" on booking_expenses for all using (is_admin()) with check (is_admin());

create table booking_settlements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references events(id),
  client_charge numeric not null,
  total_artist_vendor_cost numeric not null,
  asp_cut numeric not null,
  agent_fee numeric,
  deposit_received numeric not null default 0,
  balance_received numeric not null default 0,
  travel_reimbursement numeric not null default 0,
  expenses_paid numeric not null default 0,
  profit numeric not null,
  closed_by uuid not null references admin_users(id),
  closed_at timestamptz not null default now()
);
alter table booking_settlements enable row level security;
create policy "admin manages booking settlements" on booking_settlements for all using (is_admin()) with check (is_admin());
