-- Event details form reminders (owner 2026-11-09: "4 and 2 weeks before"): if the client hasn't filled in the
-- form, client-followups resends the link 28 and 14 days before the gig. Logged once each as kind
-- 'gig_form_nudge' with ref '28' / '14'.
-- Applied: 2026-11-09 (supabase/run-sql.sh, verified)

begin;
alter table public.client_followups drop constraint if exists client_followups_kind_check;
alter table public.client_followups add constraint client_followups_kind_check
  check (kind in ('deposit_reminder', 'balance_reminder', 'deposit_confirmed', 'contract_sent', 'balance_paid',
                  'gig_reminder', 'flight_reminder', 'office_signed', 'office_deposit', 'office_balance',
                  'gig_form', 'gig_form_wa', 'office_payouts', 'gig_form_nudge'));
commit;
