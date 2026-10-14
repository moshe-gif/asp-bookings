-- 0056: Clients pay online with Stripe (step 2 of the "one link" flow; step 1, signing, is 0052).
-- Applied: 2026-10-13 (supabase/run-sql.sh, verified)
--
-- One row per payment link. Two kinds:
--   contract_deposit -- made with a contract's signing link and keyed by the SAME token, so the
--                       client's /sign/ page shows "Pay deposit" once they've signed.
--   invoice          -- a custom invoice (Financials) with its own token, paid at /pay/#<token>.
-- The public `client-pay` Edge Function is the only thing that reads a row by token, and it and
-- `stripe-webhook` (both service role) are the only writers of the payment columns. Like signing, the
-- server never edits the contract, gig or invoice money: the app (applyClientPayments in asp.js) marks
-- the deposit received / the invoice paid when a row turns paid.
--
-- Fees (owner 2026-10-13): bank transfer (ACH) has no fee for the client; a CREDIT card may carry a
-- card fee (card_fee_bps, 0-300 = 0-3%, frozen when the link is made); debit and prepaid cards never
-- do (card-network rules). Stripe tells the server a card's funding type before the charge, and the
-- client sees the fee and total before they press Pay (NY GBL §518).
--
-- Security: only a SHA-256 of the token is stored. Admins create rows and cancel unpaid ones, nothing
-- else; the amount and fee can't change after insert.

begin;

create table if not exists payment_requests (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  kind text not null check (kind in ('contract_deposit', 'invoice')),
  -- contract_deposit: the contract (as in contract_sign_requests) and its gig
  contract_legacy_id text,
  contract_created_at text,
  event_legacy_id text,
  -- invoice: the custom invoice (app_records collection 'invoices') and a frozen copy of it
  invoice_legacy_id text,
  invoice_created_at text,
  rendered_html text check (rendered_html is null or length(rendered_html) <= 300000),
  brand_key text,
  client_name text,
  client_email text,
  description text not null check (length(description) between 1 and 200),
  amount_cents integer not null check (amount_cents between 50 and 10000000),
  card_fee_bps integer not null default 0 check (card_fee_bps between 0 and 300),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 days',
  revoked_at timestamptz,
  first_viewed_at timestamptz,
  -- payment state, written by the Edge Functions only
  pay_status text not null default 'open' check (pay_status in ('open', 'processing', 'paid', 'failed', 'refunded', 'disputed')),
  attempt_started_at timestamptz,        -- a pay attempt in flight (blocks a second one for 2 minutes)
  payment_intent_id text,
  pay_method text check (pay_method is null or pay_method in ('card', 'us_bank_account')),
  card_brand text,
  card_funding text,
  pay_last4 text,
  fee_cents integer,
  total_cents integer,
  processing_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  failure_message text,
  refunded_at timestamptz,
  disputed_at timestamptz,
  check (kind <> 'contract_deposit' or (contract_legacy_id is not null and contract_created_at is not null)),
  check (kind <> 'invoice' or (invoice_legacy_id is not null and invoice_created_at is not null and rendered_html is not null)),
  check (pay_status <> 'paid' or (paid_at is not null and total_cents is not null))
);
create index if not exists payment_requests_contract on payment_requests (contract_legacy_id, contract_created_at);
create index if not exists payment_requests_invoice on payment_requests (invoice_legacy_id, invoice_created_at);
create unique index if not exists payment_requests_intent on payment_requests (payment_intent_id) where payment_intent_id is not null;

-- What a link charges is fixed when it's made; a paid (or in-flight) payment can't be cancelled.
create or replace function payment_requests_guard() returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.pay_status := 'open'; new.attempt_started_at := null; new.payment_intent_id := null; new.pay_method := null;
    new.card_brand := null; new.card_funding := null; new.pay_last4 := null; new.fee_cents := null; new.total_cents := null;
    new.processing_at := null; new.paid_at := null; new.failed_at := null; new.failure_message := null;
    new.refunded_at := null; new.disputed_at := null; new.first_viewed_at := null; new.revoked_at := null;
    return new;
  end if;
  if new.token_hash is distinct from old.token_hash or new.kind is distinct from old.kind
     or new.contract_legacy_id is distinct from old.contract_legacy_id or new.contract_created_at is distinct from old.contract_created_at
     or new.event_legacy_id is distinct from old.event_legacy_id or new.invoice_legacy_id is distinct from old.invoice_legacy_id
     or new.invoice_created_at is distinct from old.invoice_created_at or new.rendered_html is distinct from old.rendered_html
     or new.amount_cents is distinct from old.amount_cents or new.card_fee_bps is distinct from old.card_fee_bps
     or new.description is distinct from old.description then
    raise exception 'a payment link''s amount and document cannot be changed';
  end if;
  if old.revoked_at is not null and new.revoked_at is null then
    raise exception 'a cancelled payment link cannot be re-opened';
  end if;
  if new.revoked_at is not null and old.revoked_at is null and old.pay_status in ('processing', 'paid', 'refunded', 'disputed') then
    raise exception 'a paid payment link cannot be cancelled';
  end if;
  if old.paid_at is not null and new.paid_at is distinct from old.paid_at then
    raise exception 'a payment cannot be un-recorded';
  end if;
  return new;
end $$;
drop trigger if exists payment_requests_guard on payment_requests;
create trigger payment_requests_guard before insert or update on payment_requests
  for each row execute function payment_requests_guard();

alter table payment_requests enable row level security;
create policy "admins read payment links" on payment_requests for select using (is_admin());
create policy "admins create payment links" on payment_requests for insert with check (is_admin());
create policy "admins cancel payment links" on payment_requests for update using (is_admin()) with check (is_admin());

revoke all on payment_requests from anon, authenticated;
grant select on payment_requests to authenticated;
grant insert (token_hash, kind, contract_legacy_id, contract_created_at, event_legacy_id, invoice_legacy_id,
  invoice_created_at, rendered_html, brand_key, client_name, client_email, description, amount_cents, card_fee_bps, expires_at)
  on payment_requests to authenticated;
grant update (revoked_at) on payment_requests to authenticated;
grant select, insert, update on payment_requests to service_role;

-- The ledger of money received (payments, 0012) learns a new source.
alter table payments drop constraint if exists payments_source_check;
alter table payments add constraint payments_source_check check (source in ('quickbooks', 'zelle_auto', 'zelle_reviewed', 'manual', 'stripe'));

-- One line on a gig's activity log, appended in place (the Edge Functions' "paid online" note). Can
-- be lost if an admin's unsent edit to that gig overwrites it, as with signing (0052); the payment
-- itself can't be. Service role only.
create or replace function append_event_log(p_legacy_id text, p_entry jsonb) returns void
language sql security definer set search_path = public as $$
  update events set app_doc = jsonb_set(app_doc, '{log}', coalesce(app_doc->'log', '[]'::jsonb) || jsonb_build_array(p_entry))
    where legacy_id = p_legacy_id and app_doc is not null;
$$;
revoke all on function append_event_log(text, jsonb) from public, anon, authenticated;
grant execute on function append_event_log(text, jsonb) to service_role;

-- Admins see a payment arrive live (the app reloads payment links on any change; it never reads the payload).
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'payment_requests') then
    alter publication supabase_realtime add table payment_requests;
  end if;
end $$;

commit;
