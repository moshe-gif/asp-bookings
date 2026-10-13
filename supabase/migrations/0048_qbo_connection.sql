-- Recreates qbo_connection (0009), which is missing from the live database (found 2026-10-12).
-- The QuickBooks Edge Functions (qbo-oauth-callback, qbo-status, qbo-webhook, _shared/qbo.ts) read
-- and write it. Same shape as 0009: a single row of OAuth tokens. RLS is on with no policies, and
-- anon/authenticated get no grants, so only the Edge Functions (service role) can touch it.
-- Applied: 2026-10-12 (Management API).

create table if not exists public.qbo_connection (
  id int primary key default 1 check (id = 1), -- enforces at most one row
  realm_id text not null,                       -- QuickBooks company id
  access_token text not null,
  refresh_token text not null,
  access_token_expires_at timestamptz not null,
  refresh_token_expires_at timestamptz not null,
  connected_by uuid references auth.users(id),
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.qbo_connection enable row level security;
revoke all on public.qbo_connection from anon, authenticated;
grant select, insert, update, delete on public.qbo_connection to service_role;
