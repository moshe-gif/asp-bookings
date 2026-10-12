-- 0044: Everything goes to office@aspmgmt.com (owner, 2026-10-12).
-- Applied: 2026-10-12 (supabase/run-sql.sh, verified)
--
-- Client replies (reply-to on every email the app sends) and the office email printed on documents,
-- for both brands. The Zelle payment identifier on payee profiles is NOT an email destination and is
-- unchanged.

begin;
update brand_config set reply_to = 'office@aspmgmt.com', email = 'office@aspmgmt.com', updated_at = now()
 where brand_key in ('asp', 'sing');
commit;
