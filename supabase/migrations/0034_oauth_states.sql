-- 0034: one-time OAuth `state` values for QuickBooks / Google Calendar / Gmail connections
-- (2026-10-09 audit 1.2). Applied: 2026-10-10 (Supabase Management API, verified)
--
-- The oauth-start Edge Function (signed-in admins only) inserts a random nonce here; the matching
-- *-oauth-callback deletes-and-returns it, rejecting unknown, reused, expired or wrong-provider
-- states. Service role only: RLS on with no policies, and no grants to app roles.

begin;
create table if not exists oauth_states (
  nonce text primary key,
  provider text not null check (provider in ('qbo','gcal','gmail')),
  user_id uuid not null references auth.users(id) on delete cascade,
  mailbox_id uuid references gmail_mailboxes(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table oauth_states enable row level security;
revoke all on oauth_states from anon, authenticated;
commit;
