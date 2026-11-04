-- Monthly payouts, made safe (code review of 0078, 2026-11-04):
--  * claiming a month's money for one payee and creating its payout happen in ONE transaction under one
--    lock (claim_month_payout), and the payout's amount is exactly what was claimed -- two presses at once,
--    or two months at once, can never send the same money twice;
--  * a singer's share on a gig the office already marked Paid Out by hand is never claimed (no double pay);
--  * a payout can be voided (rejected in Mercury): its money is released for the next payout and its
--    gigs lose Paid Out (void_month_payout) -- so the (month, payee) slot only counts payouts not voided;
--  * Re-split only drops a payment that needs review and has nothing paid out, under the same lock.
--
-- Applied: 2026-11-04 (supabase/run-sql.sh, verified)

begin;

alter table public.monthly_payouts drop constraint if exists monthly_payouts_status_check;
alter table public.monthly_payouts add constraint monthly_payouts_status_check check (status in ('sending', 'sent', 'failed', 'test', 'voided'));
alter table public.monthly_payouts drop constraint if exists monthly_payouts_month_payee_key_key;
create unique index if not exists monthly_payouts_one_per_month on public.monthly_payouts (month, payee_key) where status <> 'voided';
alter table public.monthly_payouts add column if not exists voided_at timestamptz;
alter table public.monthly_payouts add column if not exists voided_by uuid;
create index if not exists money_ledger_gig on public.money_ledger (event_legacy_id);

-- What a payee's next payout takes: unpaid, not under review, landed by the month's end, and (for a
-- singer's share) not on a gig already marked Paid Out by hand.
create or replace function public.claim_month_payout(p_month text, p_payee_key text, p_kind text, p_name text, p_destination text, p_by uuid)
returns table (payout_id uuid, amount_cents bigint)
language plpgsql security definer set search_path = public as $$
declare
  v_end date := (to_date(p_month || '-01', 'YYYY-MM-DD') + interval '1 month' - interval '1 day')::date;
  v_total bigint;
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('asp_monthly_payouts'));
  if exists (select 1 from monthly_payouts m where m.month = p_month and m.payee_key = p_payee_key and m.status <> 'voided') then return; end if;
  select coalesce(sum(p.cents), 0) into v_total
    from money_ledger_parts p join money_ledger l on l.id = p.ledger_id
    left join events e on e.legacy_id = l.event_legacy_id
   where p.payee_key = p_payee_key and p.payout_id is null and l.needs_review is null and l.received_on <= v_end
     and (p.kind <> 'share' or not coalesce(e.artist_paid_out, false));
  if v_total <= 0 then return; end if;
  insert into monthly_payouts (month, kind, payee_key, payee_name, amount_cents, status, destination, created_by)
    values (p_month, p_kind, p_payee_key, p_name, v_total, 'sending', p_destination, p_by) returning id into v_id;
  update money_ledger_parts p set payout_id = v_id
    from money_ledger l left join events e on e.legacy_id = l.event_legacy_id
   where l.id = p.ledger_id and p.payee_key = p_payee_key and p.payout_id is null and l.needs_review is null and l.received_on <= v_end
     and (p.kind <> 'share' or not coalesce(e.artist_paid_out, false));
  return query select v_id, v_total;
end $$;

-- A payout rejected or cancelled in Mercury: release its money for the next payout. Returns the gigs it
-- touched (the caller takes Paid Out off them).
create or replace function public.void_month_payout(p_id uuid, p_by uuid)
returns table (event_legacy_id text)
language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('asp_monthly_payouts'));
  update monthly_payouts set status = 'voided', voided_at = now(), voided_by = p_by where id = p_id and status in ('sent', 'failed', 'sending');
  if not found then return; end if;
  return query
    with freed as (update money_ledger_parts set payout_id = null where payout_id = p_id returning ledger_id)
    select distinct l.event_legacy_id from freed f join money_ledger l on l.id = f.ledger_id;
end $$;

create or replace function public.resplit_ledger_row(p_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('asp_monthly_payouts'));
  delete from money_ledger l where l.id = p_id and l.needs_review is not null
     and not exists (select 1 from money_ledger_parts p where p.ledger_id = l.id and p.payout_id is not null);
  return found;
end $$;

revoke all on function public.claim_month_payout(text, text, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.void_month_payout(uuid, uuid) from public, anon, authenticated;
revoke all on function public.resplit_ledger_row(uuid) from public, anon, authenticated;
grant execute on function public.claim_month_payout(text, text, text, text, text, uuid) to service_role;
grant execute on function public.void_month_payout(uuid, uuid) to service_role;
grant execute on function public.resplit_ledger_row(uuid) to service_role;

commit;
