-- 0092: when the client last tapped "I've sent it with Zelle" on a pay link (client-pay `zelle_sent`).
-- One guard for every kind of link: the office is told at most once per 10 minutes per link. Before this the
-- guard lived on the gig, so an invoice link (no gig) could email the office on every tap (review 2026-11-10).
-- Server-written only (payment_requests has no client policies).
--
-- Applied: 2026-11-10 (supabase/run-sql.sh)

alter table public.payment_requests add column if not exists zelle_reported_at timestamptz;
