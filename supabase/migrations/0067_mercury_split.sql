-- Singers' money split automatically into their own Mercury accounts (owner 2026-10-27: "i really want
-- to create sub accounts that the money can automatically get split up so my payouts are easier").
--
-- ASP banks at Mercury: one main account plus one account per singer (each with its own account and
-- routing number). The mercury function (every 10 minutes, read-only on the bank) reads every
-- account's incoming money and turns each credit into an inbox_items "Money in" row (bank_verified,
-- bank 'Mercury'), so the app records exact matches just like a bank's email alert. When a gig's
-- balance lands in ASP's MAIN account (a wire, an ACH, or a Stripe payment once payouts go to ASP),
-- each artist's whole share (fee less commission, plus charges) is proposed as an internal transfer to
-- their own Mercury account; an admin approves it and the function moves the money.
-- Nothing moves without an approval (and, until MERCURY_LIVE=yes, nothing moves on the real bank).
--
-- 1. mercury_accounts: the bank's accounts as Mercury lists them, and which is ASP's main account or
--    which payee profile (app_records 'payee_profiles') each singer's account belongs to. Account
--    numbers are never stored here -- only Mercury's own account id and name.
-- 2. mercury_transactions: each incoming credit read from the bank (one row per Mercury transaction).
-- 3. mercury_transfers: a share owed to an artist, from ASP's main account to theirs: proposed ->
--    sent (or failed / cancelled / test). One per (source, artist payee) so a payment is split once.
-- 4. payment_requests.payout_via: 'mercury' when a balance paid online went to ASP's own Stripe
--    account (not the artist's Stripe account), so it is split the same way.
--
-- Applied: 2026-10-27 (supabase/run-sql.sh, verified)

begin;

create table if not exists public.mercury_accounts (
  account_id text primary key check (length(account_id) between 1 and 64),
  name text,
  kind text,                       -- Mercury's kind (checking / savings / ...)
  status text,
  role text check (role in ('main', 'payee', 'ignore')),
  payee_profile_id text check (payee_profile_id is null or length(payee_profile_id) between 1 and 64),
  last_seen_at timestamptz,
  updated_at timestamptz not null default now(),
  check (role is distinct from 'payee' or payee_profile_id is not null)
);
create unique index if not exists mercury_accounts_one_main on public.mercury_accounts ((role)) where role = 'main';
create unique index if not exists mercury_accounts_payee on public.mercury_accounts (payee_profile_id) where role = 'payee';

create table if not exists public.mercury_transactions (
  id text primary key,             -- Mercury's transaction id
  account_id text not null,
  amount_cents bigint not null,
  kind text,
  status text,
  counterparty text,
  memo text,
  posted_at timestamptz,
  created_at timestamptz,
  inbox_item_id uuid,
  seen_at timestamptz not null default now()
);
create index if not exists mercury_transactions_account on public.mercury_transactions (account_id, created_at desc);

create table if not exists public.mercury_transfers (
  id uuid primary key default gen_random_uuid(),
  event_legacy_id text not null,
  source text not null check (source in ('mercury', 'stripe')),
  source_id text not null,         -- the Mercury transaction id, or the payment_requests id
  payee_profile_id text not null,
  payee_name text,
  amount_cents bigint not null check (amount_cents > 0),
  status text not null default 'proposed' check (status in ('proposed', 'sending', 'sent', 'failed', 'cancelled', 'test')),
  note text,
  error text,
  mercury_debit_id text,
  created_at timestamptz not null default now(),
  decided_by uuid,
  decided_at timestamptz,
  sent_at timestamptz,
  unique (source, source_id, payee_profile_id)
);
create index if not exists mercury_transfers_status on public.mercury_transfers (status, created_at desc);

create table if not exists public.mercury_sync_state (
  id int primary key default 1 check (id = 1),
  last_run_at timestamptz,
  last_error text
);
insert into public.mercury_sync_state (id) values (1) on conflict do nothing;

alter table public.payment_requests add column if not exists payout_via text check (payout_via is null or payout_via in ('stripe_connect', 'mercury'));

-- Admins read; only the mercury function (service role) writes -- approving goes through it.
alter table public.mercury_accounts enable row level security;
alter table public.mercury_transactions enable row level security;
alter table public.mercury_transfers enable row level security;
alter table public.mercury_sync_state enable row level security;
drop policy if exists "admins read mercury accounts" on public.mercury_accounts;
drop policy if exists "admins read mercury transactions" on public.mercury_transactions;
drop policy if exists "admins read mercury transfers" on public.mercury_transfers;
drop policy if exists "admins read mercury sync state" on public.mercury_sync_state;
create policy "admins read mercury accounts" on public.mercury_accounts for select using ((select is_admin()));
create policy "admins read mercury transactions" on public.mercury_transactions for select using ((select is_admin()));
create policy "admins read mercury transfers" on public.mercury_transfers for select using ((select is_admin()));
create policy "admins read mercury sync state" on public.mercury_sync_state for select using ((select is_admin()));
revoke all on public.mercury_accounts, public.mercury_transactions, public.mercury_transfers, public.mercury_sync_state from anon, authenticated;
grant select on public.mercury_accounts, public.mercury_transactions, public.mercury_transfers, public.mercury_sync_state to authenticated;
grant all on public.mercury_accounts, public.mercury_transactions, public.mercury_transfers, public.mercury_sync_state to service_role;

commit;
