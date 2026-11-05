-- Client gig-info form (owner 2026-11-05: "a online form for the client to fill out for all of the info that we
-- want to get from them once they send a deposit and hold the date ... that will auto fill the gig info in the
-- app ... the form should differ based on the gig type ... and not needed for concerts").
--  * gig_form_links: one row per link (app.aspmgmt.com/form/#<token>). Like contract_sign_requests (0052) only the
--    token's SHA-256 is stored. The client's answers live on the gig itself (events.app_doc.clientForm), written
--    by the gig-form Edge Function; the row keeps when it was viewed / last submitted.
--  * client_followups kinds gig_form (email) and gig_form_wa (WhatsApp): sent once per gig after the deposit.
--    Gigs whose deposit was already in before this shipped are marked done ('baseline') so the first run doesn't
--    message them; the office can still send any gig's form from the gig (Gig Info → Client form).
-- Applied: 2026-11-05 (supabase/run-sql.sh, verified)

begin;

create table if not exists public.gig_form_links (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  event_legacy_id text not null,
  created_at timestamptz not null default now(),
  created_by uuid,
  expires_at timestamptz not null default now() + interval '400 days',
  revoked_at timestamptz,
  first_viewed_at timestamptz,
  submitted_at timestamptz,
  submit_count int not null default 0
);
create index if not exists gig_form_links_gig on public.gig_form_links (event_legacy_id);
alter table public.gig_form_links enable row level security;
drop policy if exists "admins read gig form links" on public.gig_form_links;
create policy "admins read gig form links" on public.gig_form_links for select using ((select is_admin()));

alter table public.client_followups drop constraint if exists client_followups_kind_check;
alter table public.client_followups add constraint client_followups_kind_check
  check (kind in ('deposit_reminder', 'balance_reminder', 'deposit_confirmed', 'contract_sent', 'balance_paid',
                  'gig_reminder', 'flight_reminder', 'office_signed', 'office_deposit', 'office_balance',
                  'gig_form', 'gig_form_wa'));

insert into public.client_followups (event_legacy_id, kind, sent_to, ok, error)
select e.legacy_id, k.kind, 'baseline', true, 'deposit in before the gig form started (2026-11-05)'
  from public.events e cross join (values ('gig_form'), ('gig_form_wa')) k(kind)
 where coalesce((e.app_doc ->> 'depositReceived')::boolean, false)
   and not exists (select 1 from public.client_followups f where f.event_legacy_id = e.legacy_id and f.kind = k.kind);

commit;
