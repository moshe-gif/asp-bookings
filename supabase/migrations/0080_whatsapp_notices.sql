-- More automatic WhatsApps (owner 2026-11-04: "all" of): contract sent (client gets the sign link), balance
-- paid (client thank-you), singer gig reminder 3 days before + "prepare for your flight" 3 days before a
-- flight, and office alerts (contract signed, deposit / balance in). Sent by client-followups, once each,
-- logged in client_followups like the others.
--  * artists.whatsapp: the singer's own WhatsApp number (set by the office in Settings → accounts; admins and
--    the singer themselves read it, like the rest of their row).
--  * The kinds below. Things that already happened before this shipped are marked done ('baseline'), so
--    the first run doesn't message anyone about old contracts, payments or signatures.
-- Applied: 2026-11-04 (supabase/run-sql.sh, verified)

begin;
alter table public.artists add column if not exists whatsapp text check (whatsapp is null or length(whatsapp) <= 30);

alter table public.client_followups drop constraint if exists client_followups_kind_check;
alter table public.client_followups add constraint client_followups_kind_check
  check (kind in ('deposit_reminder', 'balance_reminder', 'deposit_confirmed', 'contract_sent', 'balance_paid',
                  'gig_reminder', 'flight_reminder', 'office_signed', 'office_deposit', 'office_balance'));
alter table public.client_followups add column if not exists ref text;   -- what a once-only notice was about (sign request id, artist id)

insert into public.client_followups (event_legacy_id, kind, sent_to, ok, error, ref)
select r.event_legacy_id, 'contract_sent', 'baseline', true, 'sent before contract WhatsApps started (2026-11-04)', r.id::text
  from public.contract_sign_requests r where r.event_legacy_id is not null;
insert into public.client_followups (event_legacy_id, kind, sent_to, ok, error, ref)
select r.event_legacy_id, 'office_signed', 'baseline', true, 'signed before office alerts started (2026-11-04)', r.id::text
  from public.contract_sign_requests r where r.signed_at is not null and r.event_legacy_id is not null;
insert into public.client_followups (event_legacy_id, kind, sent_to, ok, error)
select e.legacy_id, k.kind, 'baseline', true, 'before this notice started (2026-11-04)'
  from public.events e cross join (values ('balance_paid', 'balanceReceived'), ('office_balance', 'balanceReceived'), ('office_deposit', 'depositReceived')) k(kind, field)
 where coalesce((e.app_doc ->> k.field)::boolean, false);
commit;
