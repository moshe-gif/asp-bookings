-- Automatic client follow-ups (owner 2026-10-14): a daily server job (client-followups Edge Function,
-- scheduled with pg_cron) emails a deposit reminder every 7 days while a sent contract is unpaid and a
-- balance reminder every 7 days while a confirmed date has a balance due. This table is its log and
-- its memory: the job reads the last send per gig + kind to keep the 7-day rhythm, and the office can
-- see every reminder that went (or failed). Written only by the server (service role); admins read it.
-- The schedule itself is added once the function is deployed (see supabase/README.md).
-- Applied: 2026-10-14 (Management API).

create extension if not exists pg_cron;

create table if not exists public.client_followups (
  id uuid primary key default gen_random_uuid(),
  event_legacy_id text not null,               -- the gig, e.g. "EV-1063"
  contract_legacy_id text,                     -- the contract the reminder was about, if any
  kind text not null check (kind in ('deposit_reminder', 'balance_reminder')),
  sent_to text,
  sent_at timestamptz not null default now(),
  ok boolean not null,
  error text,
  provider_id text                             -- Resend message id, when sent through Resend
);
create index if not exists client_followups_gig_kind_time on public.client_followups (event_legacy_id, kind, sent_at desc);

alter table public.client_followups enable row level security;
create policy "admins read client follow-ups" on public.client_followups for select using (is_admin());
revoke all on public.client_followups from anon, authenticated;
grant select on public.client_followups to authenticated;
grant all on public.client_followups to service_role;
