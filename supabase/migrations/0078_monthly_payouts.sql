-- Monthly payouts (owner 2026-11-04: "i dont want each gig to have a payout, i want the payouts to be in
-- the financials page on a monthly basis, so all gigs and splitups how it went into mercury should be
-- saved in the financials page, and then monthly i want to payout artists amount and send the commission
-- to ilan chase account").
--
-- 1. money_ledger: every client payment that reached ASP (a Mercury credit recorded on its gig, or a
--    Stripe payment), once -- the gig, the date it landed, the amount and where it went.
-- 2. money_ledger_parts: how that payment splits -- each singer's share and ASP's commission. A part
--    is unpaid until a monthly payout takes it (payout_id).
-- 3. monthly_payouts: one per month per singer (to their own Mercury account) plus one for the
--    commission (to the outside account picked in Settings, e.g. a Chase account added as a Mercury
--    recipient). A month's payout takes every unpaid part that landed on or before the month's end,
--    so a payment recorded late rolls into the next payout instead of being lost.
-- The old per-gig proposals (mercury_transfers) are no longer made; the table stays as history.
-- Admins read; only the mercury function (service role) writes.
--
-- Applied: 2026-11-04 (supabase/run-sql.sh, verified)

begin;

create table if not exists public.money_ledger (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('mercury', 'stripe')),
  source_id text not null,                 -- the Mercury transaction id or the payment_requests id
  event_legacy_id text not null,
  kind text not null check (kind in ('deposit', 'balance')),
  received_on date not null,               -- New York date the money landed / was paid
  amount_cents bigint not null check (amount_cents > 0),
  went_to text not null,                   -- 'main' | 'singer' | 'singer_stripe' | 'stripe'
  note text,
  needs_review text,                       -- why the split couldn't be made (nothing is paid until fixed)
  created_at timestamptz not null default now(),
  unique (source, source_id)
);
create index if not exists money_ledger_received on public.money_ledger (received_on desc);

create table if not exists public.monthly_payouts (
  id uuid primary key default gen_random_uuid(),
  month text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  kind text not null check (kind in ('share', 'commission')),
  payee_key text not null,                 -- the singer's payee profile id, or 'commission'
  payee_name text,
  amount_cents bigint not null check (amount_cents > 0),
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed', 'test')),
  destination text,                        -- account / recipient name (never a number)
  mercury_request_id text,
  error text,
  created_by uuid,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (month, payee_key)
);

create table if not exists public.money_ledger_parts (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.money_ledger (id) on delete cascade,
  kind text not null check (kind in ('share', 'commission')),
  payee_key text not null,                 -- payee profile id, or 'commission'
  payee_name text,
  cents bigint not null,
  payout_id uuid references public.monthly_payouts (id) on delete set null,
  unique (ledger_id, payee_key)
);
create index if not exists money_ledger_parts_unpaid on public.money_ledger_parts (payee_key) where payout_id is null;

-- Where the commission goes: a Mercury recipient (an outside account such as Ilan's Chase, added once in
-- Mercury). Server-side so only the owner / COO / bookkeeping can change it (through the mercury
-- function), never a browser's settings copy. Only Mercury's recipient id and name -- no numbers.
create table if not exists public.mercury_settings (
  id int primary key default 1 check (id = 1),
  commission_recipient_id text,
  commission_recipient_name text,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
insert into public.mercury_settings (id) values (1) on conflict do nothing;
alter table public.mercury_settings enable row level security;
drop policy if exists "admins read mercury settings" on public.mercury_settings;
create policy "admins read mercury settings" on public.mercury_settings for select using ((select is_admin()));
revoke all on public.mercury_settings from anon, authenticated;
grant select on public.mercury_settings to authenticated;
grant all on public.mercury_settings to service_role;

alter table public.money_ledger enable row level security;
alter table public.money_ledger_parts enable row level security;
alter table public.monthly_payouts enable row level security;
drop policy if exists "admins read money ledger" on public.money_ledger;
drop policy if exists "admins read money ledger parts" on public.money_ledger_parts;
drop policy if exists "admins read monthly payouts" on public.monthly_payouts;
create policy "admins read money ledger" on public.money_ledger for select using ((select is_admin()));
create policy "admins read money ledger parts" on public.money_ledger_parts for select using ((select is_admin()));
create policy "admins read monthly payouts" on public.monthly_payouts for select using ((select is_admin()));
revoke all on public.money_ledger, public.money_ledger_parts, public.monthly_payouts from anon, authenticated;
grant select on public.money_ledger, public.money_ledger_parts, public.monthly_payouts to authenticated;
grant all on public.money_ledger, public.money_ledger_parts, public.monthly_payouts to service_role;

commit;
