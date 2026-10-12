-- 0041: Let the Edge Functions' service role use the Gmail tables.
-- Applied: 2026-10-12 (Supabase Management API, verified)
--
-- Found while smoke-testing the redeployed Edge Functions: service_role had no SELECT/INSERT/UPDATE/
-- DELETE on gmail_mailboxes or gmail_oauth_tokens (only TRUNCATE/REFERENCES/TRIGGER), so
-- gmail-status, gmail-oauth-callback and oauth-start's mailbox lookup all failed with "permission
-- denied for table gmail_mailboxes". These functions are the only intended readers of the tokens
-- (no client-facing RLS policy on gmail_oauth_tokens); browser access is unchanged.

begin;
grant select, insert, update, delete on gmail_mailboxes to service_role;
grant select, insert, update, delete on gmail_oauth_tokens to service_role;
commit;
