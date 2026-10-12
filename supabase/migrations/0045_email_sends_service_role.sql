-- 0045: Let send-contract-email record and count sends (email_sends, 0040).
-- Applied: 2026-10-12 (supabase/run-sql.sh, verified with a real send)
--
-- Found on the first real send (2026-10-12): the email went out but no email_sends row was written,
-- so the 60/hour limit could never trigger. 0040 granted authenticated SELECT only; the function
-- writes and counts with the service role, which had no INSERT/SELECT. Same gap as 0041.

begin;
grant select, insert on email_sends to service_role;
commit;
