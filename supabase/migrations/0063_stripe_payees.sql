-- 0063: Clients pay the BALANCE online, straight to the artist (Stripe Connect). Owner 2026-10-16:
-- "the initial deposit … ASP account … the 15% goes to them and then the balance goes directly to the
-- artist … I don't want the client necessarily to know".
--
-- How the money moves: ASP stays the business the client pays (its name on the card statement and the
-- receipt). Each artist's payee gets a Stripe account of its own (Stripe Express: the artist enters
-- their bank and tax details on Stripe's site), and a balance payment is a "destination charge": Stripe
-- takes the payment on ASP's account and passes the balance on to the artist's account at once. The
-- card fee a client pays on a credit card (if any) stays with ASP, to cover Stripe's fee.
--
-- 1. stripe_payees: one row per payee profile (app_records 'payee_profiles') that has a Stripe
--    account. Two profiles of the same company (say Airschnitz for two artists) can share one account.
--    Written only by the Edge Functions (stripe-connect, payee-onboard); admins read it. The artist's
--    setup link is a token, stored only as its SHA-256.
-- 2. payment_requests learns kind 'event_balance': a gig's balance, keyed by the gig, paid to the
--    payee profile frozen on the row. One pay attempt at a time per gig (claim_payment_attempt).
--
-- Applied: 2026-10-16 (supabase/run-sql.sh, verified)

begin;

create table if not exists stripe_payees (
  payee_profile_id text primary key check (length(payee_profile_id) between 1 and 64),
  stripe_account_id text not null check (stripe_account_id ~ '^acct_[A-Za-z0-9]+$'),
  entity_name text,
  setup_token_hash text unique check (setup_token_hash is null or setup_token_hash ~ '^[0-9a-f]{64}$'),
  setup_expires_at timestamptz,
  setup_email text,
  -- Stripe's view of the account, refreshed whenever an admin or the artist looks
  details_submitted boolean not null default false,
  transfers_active boolean not null default false,
  payouts_enabled boolean not null default false,
  requirements_due text,
  disabled_reason text,
  checked_at timestamptz,
  livemode boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stripe_payees_account on stripe_payees (stripe_account_id);

alter table stripe_payees enable row level security;
drop policy if exists "admins read stripe payees" on stripe_payees;
create policy "admins read stripe payees" on stripe_payees for select using (is_admin());
revoke all on stripe_payees from anon, authenticated;
grant select on stripe_payees to authenticated;
grant select, insert, update, delete on stripe_payees to service_role;

-- payment_requests: the balance kind
alter table payment_requests add column if not exists payee_profile_id text;
alter table payment_requests drop constraint if exists payment_requests_kind_check;
alter table payment_requests add constraint payment_requests_kind_check check (kind in ('contract_deposit', 'invoice', 'event_balance'));
alter table payment_requests drop constraint if exists payment_requests_balance_check;
alter table payment_requests add constraint payment_requests_balance_check
  check (kind <> 'event_balance' or (event_legacy_id is not null and payee_profile_id is not null));
create index if not exists payment_requests_event on payment_requests (event_legacy_id) where kind = 'event_balance';
grant insert (payee_profile_id) on payment_requests to authenticated;

-- The guard of 0057, plus: the payee a balance link pays can't change after it's made.
create or replace function payment_requests_guard() returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.pay_status := 'open'; new.attempt_started_at := null; new.payment_intent_id := null; new.pay_method := null;
    new.card_brand := null; new.card_funding := null; new.pay_last4 := null; new.fee_cents := null; new.total_cents := null;
    new.processing_at := null; new.paid_at := null; new.failed_at := null; new.failure_message := null;
    new.refunded_at := null; new.disputed_at := null; new.first_viewed_at := null; new.revoked_at := null;
    new.applied_at := null;
    return new;
  end if;
  if new.token_hash is distinct from old.token_hash or new.kind is distinct from old.kind
     or new.contract_legacy_id is distinct from old.contract_legacy_id or new.contract_created_at is distinct from old.contract_created_at
     or new.event_legacy_id is distinct from old.event_legacy_id or new.invoice_legacy_id is distinct from old.invoice_legacy_id
     or new.invoice_created_at is distinct from old.invoice_created_at or new.rendered_html is distinct from old.rendered_html
     or new.amount_cents is distinct from old.amount_cents or new.card_fee_bps is distinct from old.card_fee_bps
     or new.description is distinct from old.description or new.payee_profile_id is distinct from old.payee_profile_id then
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
  if old.applied_at is not null and new.applied_at is distinct from old.applied_at then
    raise exception 'a payment is applied once';
  end if;
  if new.applied_at is not null and old.applied_at is null and new.paid_at is null then
    raise exception 'only a paid payment can be applied';
  end if;
  return new;
end $$;

-- 0057's claim, with a gig's balance as its own key: every balance link for the same gig counts.
create or replace function claim_payment_attempt(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r payment_requests; k text; sib payment_requests;
begin
  select * into r from payment_requests where id = p_id;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  k := case when r.kind = 'invoice' then 'i|' || r.invoice_legacy_id || '|' || r.invoice_created_at
            when r.kind = 'event_balance' then 'b|' || r.event_legacy_id
            else 'c|' || r.contract_legacy_id || '|' || r.contract_created_at end;
  perform pg_advisory_xact_lock(hashtext('client-pay|' || k));
  for sib in select * from payment_requests where
      case when r.kind = 'invoice' then kind = 'invoice' and invoice_legacy_id = r.invoice_legacy_id and invoice_created_at = r.invoice_created_at
           when r.kind = 'event_balance' then kind = 'event_balance' and event_legacy_id = r.event_legacy_id
           else kind = 'contract_deposit' and contract_legacy_id = r.contract_legacy_id and contract_created_at = r.contract_created_at end
  loop
    if sib.pay_status in ('paid', 'refunded', 'disputed') then return jsonb_build_object('error', 'paid'); end if;
    if sib.pay_status = 'processing' then return jsonb_build_object('error', 'processing'); end if;
    if sib.attempt_started_at is not null and sib.attempt_started_at > now() - interval '2 minutes' then
      return jsonb_build_object('error', 'busy');
    end if;
  end loop;
  update payment_requests set attempt_started_at = now() where id = p_id returning * into r;
  return to_jsonb(r);
end $$;
revoke all on function claim_payment_attempt(uuid) from public, anon, authenticated;
grant execute on function claim_payment_attempt(uuid) to service_role;

commit;
