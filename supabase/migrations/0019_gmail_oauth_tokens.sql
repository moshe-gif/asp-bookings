-- Gmail OAuth token storage (ops automation spec item 6: Zelle matching from artist mailboxes, and
-- item 7's ASP-sending mailbox for the travel/confirmation emails once that grows beyond the
-- current relay-based sending). Separate from gmail_mailboxes (0015) deliberately -- that table
-- has an "admin manages" RLS policy (an admin's own real session can read it directly, which is
-- right for the connection metadata: email, watch expiry, last sync), but tokens must never be
-- reachable that way. Same "RLS enabled, zero policies, service-role only" pattern as
-- qbo_connection (0009) and gcal_connection (0017) -- one row per mailbox, since (unlike QuickBooks
-- or Google Calendar, both single ASP-wide connections) Gmail here means potentially many separate
-- mailboxes, each authorized by its own owner (an artist authorizing their own inbox, or Rivky/ASP
-- authorizing the sending mailbox), not one shared ASP account.
create table gmail_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  gmail_mailbox_id uuid not null unique references gmail_mailboxes(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  access_token_expires_at timestamptz not null,
  connected_by uuid references auth.users(id),
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table gmail_oauth_tokens enable row level security;
-- Intentionally no policies -- default-deny for anon/authenticated. Edge Functions use the
-- service-role key to read/write this table directly.
