-- 0072: WhatsApp "deposit received, booking confirmed" (owner 2026-10-29: "when a deposit comes in i want to
-- send a auto whatsapp to the client saying we received the deposit and booking is confirmed"). Sent once per
-- gig by client-followups {only:"deposit_confirmations"} (pg_cron every 10 minutes) and logged as kind
-- 'deposit_confirmed'. Gigs whose deposit was already in are marked done ('baseline', nothing sent), so the
-- first run doesn't message every booked client about an old deposit.
-- Applied: 2026-10-29 (supabase/run-sql.sh)

begin;
alter table public.client_followups drop constraint if exists client_followups_kind_check;
alter table public.client_followups add constraint client_followups_kind_check
  check (kind in ('deposit_reminder', 'balance_reminder', 'deposit_confirmed'));

insert into public.client_followups (event_legacy_id, kind, sent_to, ok, error)
select legacy_id, 'deposit_confirmed', 'baseline', true, 'deposit was in before WhatsApp confirmations started (2026-10-29); nothing sent'
  from public.events e
 where coalesce((app_doc ->> 'depositReceived')::boolean, false)
   and not exists (select 1 from public.client_followups f where f.event_legacy_id = e.legacy_id and f.kind = 'deposit_confirmed');
commit;
