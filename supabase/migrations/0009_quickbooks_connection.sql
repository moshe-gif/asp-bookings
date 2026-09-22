-- QuickBooks Online OAuth connection storage, for the Send Contract -> QuickBooks invoice flow.
-- Single-row table (ASP has exactly one QBO company) holding the OAuth tokens needed to call the
-- QuickBooks Accounting API on ASP's behalf. RLS is enabled with NO policies at all -- this table
-- is never read or written from the browser; only Edge Functions touch it, using the service-role
-- key (which bypasses RLS entirely), matching this app's "secrets live server-side only" rule.
-- Tokens themselves are stored as returned by Intuit's OAuth token endpoint -- not separately
-- encrypted at the column level, since the table is already unreachable from any client-exposed
-- key (anon/authenticated roles have zero grants here).

create table qbo_connection (
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
alter table qbo_connection enable row level security;
-- Intentionally no policies -- default-deny for anon/authenticated. Edge Functions use the
-- service-role key to read/write this table directly.
