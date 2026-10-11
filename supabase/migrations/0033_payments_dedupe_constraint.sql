-- 0033: payments can't be recorded twice for the same source event (2026-10-09 audit 2.13).
-- Applied: 2026-10-10 (Supabase Management API, verified)
--
-- qbo-webhook used to dedupe with select-then-insert, so two concurrent deliveries of the same
-- Intuit notification could both insert a "received" payment. qbo-webhook now upserts on this
-- constraint. NULL source_ref values stay allowed (Postgres treats NULLs as distinct).
--
-- If this fails with a duplicate-key error, duplicates already exist: find them with
--   select source, source_ref, count(*) from payments where source_ref is not null
--   group by 1,2 having count(*) > 1;
-- resolve them by hand, then run this again.

alter table payments add constraint payments_source_source_ref_unique unique (source, source_ref);
