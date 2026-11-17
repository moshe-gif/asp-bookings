-- 0099: a record of every email the server sends (owner 2026-11-17, "did all of the emails ... go out?").
-- Receipts, confirmations, reminders and office notices all go through _shared/mail.ts sendRelayEmail, which
-- until now kept no record, so the only way to check one went out was to look in someone's inbox. Now each
-- send writes one row: who it was for, where it really went (test mode redirects to the owner), the subject,
-- which sender carried it, and whether it worked. Never the body. Service role only (RLS on, no policies);
-- the office reads it through the app later if wanted. Applied: (run by supabase/run-sql.sh)

begin;
create table if not exists public.email_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  intended_to text not null,
  sent_to text not null,
  subject text,
  via text,              -- gmail | resend | relay | null when nothing was sent
  ok boolean not null,
  error text,
  provider_id text
);
create index if not exists email_log_at on public.email_log (at desc);
create index if not exists email_log_to on public.email_log (lower(intended_to), at desc);
alter table public.email_log enable row level security;
revoke all on public.email_log from anon, authenticated;
commit;
