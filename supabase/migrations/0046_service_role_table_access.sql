-- 0046: Give the Edge Functions' service role the table access Supabase normally grants it.
-- Applied: 2026-10-12 (supabase/run-sql.sh, verified: no public table lacks service_role access)
--
-- Found 2026-10-12 while verifying the first real email send: service_role had NO table privileges
-- in public (only what 0041/0045 granted), so every Edge Function using serviceClient() failed or
-- silently read nothing -- admin-remove-user (roster rows), oauth-start / the OAuth callbacks
-- (oauth_states, tokens), qbo-create-invoice / qbo-webhook (qbo_invoices, payments),
-- gcal-create-hold (integration_connections, calendar_links), gcal-status, and send-contract-email's
-- brand lookup (fell back to built-in values). A stock Supabase project grants these by default;
-- this one never had them (0028 set defaults for `authenticated` only). service_role is used only
-- inside Edge Functions (server-side secret), never in the browser. Future tables get it too.
-- Separately noted, not fixed here: table qbo_connection (0009) does not exist in the database.

begin;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
commit;
