-- Google Calendar OAuth connection storage (ops automation spec item 4: HOLD -> CONFIRMED sync on
-- ASP's main calendar + every selected artist's calendar). Single-row table, same pattern as
-- qbo_connection (0009) -- RLS enabled with NO policies at all, never read/written from the
-- browser, only Edge Functions touch it via the service-role key. One ASP-wide Google account
-- connects (not per-artist -- ASP's own account needs write access to each artist's calendar,
-- shared via normal Google Calendar sharing, same as how a human assistant would be given access).
create table gcal_connection (
  id int primary key default 1 check (id = 1), -- enforces at most one row
  google_account_email text,
  access_token text not null,
  refresh_token text not null,
  access_token_expires_at timestamptz not null,
  connected_by uuid references auth.users(id),
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table gcal_connection enable row level security;
-- Intentionally no policies -- default-deny for anon/authenticated. Edge Functions use the
-- service-role key to read/write this table directly.
