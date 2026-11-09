-- More automatic sends (owner 2026-11-09), logged in client_followups so each goes once:
--  * gig_sheet (ref = artist id): the gig sheet emailed to each singer 7 days before the gig.
--  * thank_you: the client's thank-you + testimonial request the day after the gig.
--  * travel_request: an out-of-town gig's travel request emailed to Rivky once it's booked.
-- Applied: 2026-11-09 (supabase/run-sql.sh, verified)

begin;
alter table public.client_followups drop constraint if exists client_followups_kind_check;
alter table public.client_followups add constraint client_followups_kind_check
  check (kind in ('deposit_reminder', 'balance_reminder', 'deposit_confirmed', 'contract_sent', 'balance_paid',
                  'gig_reminder', 'flight_reminder', 'office_signed', 'office_deposit', 'office_balance',
                  'gig_form', 'gig_form_wa', 'office_payouts', 'gig_form_nudge',
                  'gig_sheet', 'thank_you', 'travel_request'));
commit;
