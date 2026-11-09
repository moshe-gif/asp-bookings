-- Monthly payout reminder (owner 2026-11-09: singers are paid monthly, "1st of the month, I send"). On the 1st,
-- client-followups' daily run WhatsApps the office alert number once: the month's payouts are ready to review and
-- send (Financials -> Monthly Payouts). Logged as kind 'office_payouts', event_legacy_id 'PAYOUTS', ref = YYYY-MM.
-- Applied: 2026-11-09 (supabase/run-sql.sh, verified)

begin;
alter table public.client_followups drop constraint if exists client_followups_kind_check;
alter table public.client_followups add constraint client_followups_kind_check
  check (kind in ('deposit_reminder', 'balance_reminder', 'deposit_confirmed', 'contract_sent', 'balance_paid',
                  'gig_reminder', 'flight_reminder', 'office_signed', 'office_deposit', 'office_balance',
                  'gig_form', 'gig_form_wa', 'office_payouts'));
commit;
