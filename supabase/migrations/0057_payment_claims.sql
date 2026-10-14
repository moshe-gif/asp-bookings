-- 0057: Online payments (0056), hardened after review, before any real payment existed.
-- Applied: 2026-10-13 (supabase/run-sql.sh, verified)
--
-- 1. applied_at: the office app marks a paid deposit received / an invoice paid exactly once. Several
--    admin browsers (desktop + phone) all see the payment arrive; the one whose
--    `update ... where applied_at is null` wins does it (and sends the client's booking confirmation),
--    the rest stand down. It can be set once, never cleared.
-- 2. claim_payment_attempt(): one pay attempt at a time per CONTRACT or INVOICE (not just per link --
--    two emailed links for the same contract must not both charge), refused when any link for it is
--    paid or processing. Service role only (client-pay).

begin;

alter table payment_requests add column if not exists applied_at timestamptz;
grant update (applied_at) on payment_requests to authenticated;

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
  if old.applied_at is not null and new.applied_at is distinct from old.applied_at then
    raise exception 'a payment is applied once';
  end if;
  if new.applied_at is not null and old.applied_at is null and new.paid_at is null then
    raise exception 'only a paid payment can be applied';
  end if;
  return new;
end $$;

-- Returns the claimed row (as jsonb), or {"error": "..."}: paid | processing | busy | not_found.
create or replace function claim_payment_attempt(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r payment_requests; k text; sib payment_requests;
begin
  select * into r from payment_requests where id = p_id;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  k := case when r.kind = 'invoice' then 'i|' || r.invoice_legacy_id || '|' || r.invoice_created_at
            else 'c|' || r.contract_legacy_id || '|' || r.contract_created_at end;
  perform pg_advisory_xact_lock(hashtext('client-pay|' || k));
  for sib in select * from payment_requests where
      case when r.kind = 'invoice' then invoice_legacy_id = r.invoice_legacy_id and invoice_created_at = r.invoice_created_at
           else contract_legacy_id = r.contract_legacy_id and contract_created_at = r.contract_created_at end
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
