-- Owner 2026-11-09 (second round): more automatic sends, each logged once in client_followups.
--  * singer_week (event 'WEEK', ref '<artist id>@<sunday>'): Sunday email to each singer with the coming week's gigs.
--    (Replaces the 7-day gig_sheet email; the singer WhatsApp is now the morning of the gig, still kind gig_reminder.)
--  * office_unpaid: WhatsApp to the owner 3 days before a gig whose balance isn't in.
--  * cash_confirm / cash_dayof: cash gigs -- the client confirms 2 days before; a WhatsApp the morning of.
--  * office_report (event 'REPORT', ref YYYY-MM): the outstanding deposits/balances email on the 1st.
-- Applied: 2026-11-09 (supabase/run-sql.sh, verified)

begin;
alter table public.client_followups drop constraint if exists client_followups_kind_check;
alter table public.client_followups add constraint client_followups_kind_check
  check (kind in ('deposit_reminder', 'balance_reminder', 'deposit_confirmed', 'contract_sent', 'balance_paid',
                  'gig_reminder', 'flight_reminder', 'office_signed', 'office_deposit', 'office_balance',
                  'gig_form', 'gig_form_wa', 'office_payouts', 'gig_form_nudge',
                  'gig_sheet', 'thank_you', 'travel_request',
                  'singer_week', 'office_unpaid', 'cash_confirm', 'cash_dayof', 'office_report'));
commit;
