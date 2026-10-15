-- Inbox watch (owner 2026-10-15: "keep an eye on the inbox ... if anything coming in it should mark it").
-- The inbox-scan job (pg_cron, every 10 minutes) reads new mail in the connected office Gmail (read-only),
-- has Claude classify each message and match it to a gig, and writes one row here. The app's Inbox list
-- shows them with a suggested action; nothing on a gig changes until an admin acts on it.
-- Server writes rows (service role); admins read them and mark them done/dismissed.
-- Applied: 2026-10-15 (Management API).

create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  gmail_message_id text not null unique,
  gmail_thread_id text,
  received_at timestamptz,
  from_addr text,
  subject text,
  snippet text,
  kind text not null check (kind in ('travel_confirmation','booking_inquiry','payment_notice','gig_info','client_reply','other')),
  summary text,
  event_legacy_id text,          -- the gig it matched, e.g. "EV-1063" (null when none / a new inquiry)
  match_note text,               -- why it matched (or what was looked for)
  extracted jsonb,               -- the fields Claude pulled out (travel legs, lead fields, amount, sheet...)
  status text not null default 'new' check (status in ('new','done','dismissed')),
  created_at timestamptz not null default now(),
  handled_at timestamptz,
  handled_by uuid
);
create index if not exists inbox_items_status_time on public.inbox_items (status, received_at desc);

create table if not exists public.inbox_scan_state (
  id int primary key default 1 check (id = 1),
  last_internal_date bigint not null default 0,   -- Gmail internalDate (ms) of the newest message scanned
  last_run_at timestamptz,
  last_error text
);
insert into public.inbox_scan_state (id) values (1) on conflict do nothing;

alter table public.inbox_items enable row level security;
alter table public.inbox_scan_state enable row level security;
create policy "admins read inbox items" on public.inbox_items for select using (is_admin());
create policy "admins mark inbox items" on public.inbox_items for update using (is_admin()) with check (is_admin());
create policy "admins read inbox scan state" on public.inbox_scan_state for select using (is_admin());
revoke all on public.inbox_items, public.inbox_scan_state from anon, authenticated;
grant select, update on public.inbox_items to authenticated;
grant select on public.inbox_scan_state to authenticated;
grant all on public.inbox_items, public.inbox_scan_state to service_role;
