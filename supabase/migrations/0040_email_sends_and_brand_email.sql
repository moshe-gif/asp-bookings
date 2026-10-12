-- 0040: Email send log + office email on the ASP brand (2026-10-09 audit 1.8 / 3.13).
-- Applied: 2026-10-12 (Supabase Management API, verified)
--
-- email_sends: one row per email the send-contract-email Edge Function actually sent (who sent it,
-- to whom, subject, brand). The function counts a sender's rows in the last hour to cap sending
-- (60/hour/admin), and it is the record of what went out. Written only by the function's service
-- role; admins can read it. No body is stored (contracts carry client details; the contract's own
-- versions already keep the sent HTML).
--
-- brand_config: the ASP row's office email was empty, so documents printed a hardcoded
-- office@aspmgmt.com; the app now reads it from here (getBrandConfig). Only fills an empty value.

begin;

create table if not exists email_sends (
  id uuid primary key default gen_random_uuid(),
  sent_by uuid not null,
  sent_to text not null,
  subject text not null default '',
  brand_key text,
  sent_at timestamptz not null default now()
);
create index if not exists email_sends_sender_time on email_sends (sent_by, sent_at desc);
alter table email_sends enable row level security;
create policy "admins read email sends" on email_sends for select using (is_admin());
revoke all on email_sends from anon;
grant select on email_sends to authenticated;

update brand_config set email = 'office@aspmgmt.com', updated_at = now()
 where brand_key = 'asp' and coalesce(email, '') = '';

commit;
