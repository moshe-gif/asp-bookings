-- 0096: every recorded payment feeds the monthly payouts (2026-11-12 audit #4; owner 2026-11-12: yes to "every
-- recorded payment feeds the payouts", backfilled from Nov 1).
--
-- The payout ledger (0078) only took a payment that came in as a Mercury credit applied from Money in, or a
-- Stripe payment. A deposit or balance the office recorded by hand (Record deposit, Mark balance received, a
-- bank's email alert) never reached it, so that singer's share and ASP's commission were never paid out: on
-- 11-10 the ledger had 1 row while 111 gigs had a deposit in.
--
-- 1. money_ledger.source may now be 'office': the gig's own record that the money came in (source_id
--    '<gig>|deposit' or '<gig>|balance'). The mercury function writes it for a gig marked received (on or after
--    2026-11-01) that has no ledger row for that payment yet.
-- 2. record_ledger_row(): a payment and its split in ONE transaction, under the same lock as the monthly payout
--    claim (0079), and only if the gig's earlier parts are still what the split was worked out from (so two
--    checks at once can't take ASP's commission twice -- audit #4.2). When the bank or Stripe record of a
--    payment arrives after the office's record of it, it replaces that record (nothing paid out from it yet) or,
--    if some was already paid out, is saved for a look instead of being counted twice.
-- Service role only. Applied: (run by supabase/run-sql.sh)

begin;

alter table public.money_ledger drop constraint if exists money_ledger_source_check;
alter table public.money_ledger add constraint money_ledger_source_check check (source in ('mercury', 'stripe', 'office'));

-- Returns 'ok', 'exists' (already recorded), or 'changed' (the gig's split moved meanwhile; the next check redoes it).
create or replace function public.record_ledger_row(p_row jsonb, p_parts jsonb, p_seen_count int, p_seen_cents bigint)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_gig text := p_row->>'event_legacy_id';
  v_kind text := p_row->>'kind';
  v_source text := p_row->>'source';
  v_office uuid;
  v_office_paid boolean := false;
  v_count int;
  v_cents bigint;
  v_review text := nullif(p_row->>'needs_review', '');
  v_id uuid;
begin
  if jsonb_typeof(p_parts) is distinct from 'array' then raise exception 'parts must be an array'; end if;
  perform pg_advisory_xact_lock(hashtext('asp_monthly_payouts'));
  if exists (select 1 from money_ledger where source = v_source and source_id = p_row->>'source_id') then return 'exists'; end if;
  -- The office's record is only for a payment nothing else has recorded.
  if v_source = 'office' and exists (select 1 from money_ledger where event_legacy_id = v_gig and kind = v_kind) then return 'exists'; end if;

  if v_source <> 'office' then
    select l.id, exists (select 1 from money_ledger_parts p where p.ledger_id = l.id and p.payout_id is not null)
      into v_office, v_office_paid
      from money_ledger l where l.event_legacy_id = v_gig and l.kind = v_kind and l.source = 'office' limit 1;
  end if;

  -- The parts the caller's split was worked out from: every part of this gig, less the office record this
  -- payment replaces.
  select count(*), coalesce(sum(p.cents), 0) into v_count, v_cents
    from money_ledger_parts p join money_ledger l on l.id = p.ledger_id
   where l.event_legacy_id = v_gig and (v_office is null or v_office_paid or l.id <> v_office);
  if v_count <> p_seen_count or v_cents <> p_seen_cents then return 'changed'; end if;

  if v_office is not null and not v_office_paid then
    delete from money_ledger where id = v_office;   -- its parts go with it (on delete cascade)
  elsif v_office is not null then
    v_review := 'The office already recorded this payment and some of it was paid out -- check it is not counted twice.';
  end if;

  insert into money_ledger (source, source_id, event_legacy_id, kind, received_on, amount_cents, went_to, note, needs_review)
  values (v_source, p_row->>'source_id', v_gig, v_kind, (p_row->>'received_on')::date, (p_row->>'amount_cents')::bigint,
          p_row->>'went_to', nullif(p_row->>'note', ''), v_review)
  returning id into v_id;
  if v_review is null then
    insert into money_ledger_parts (ledger_id, kind, payee_key, payee_name, cents)
    select v_id, x->>'kind', x->>'payee_key', nullif(x->>'payee_name', ''), (x->>'cents')::bigint
      from jsonb_array_elements(p_parts) x;
  end if;
  return 'ok';
end $$;

revoke all on function public.record_ledger_row(jsonb, jsonb, int, bigint) from public, anon, authenticated;
grant execute on function public.record_ledger_row(jsonb, jsonb, int, bigint) to service_role;

commit;
