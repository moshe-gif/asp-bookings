-- The qbo-webhook handler (Phase 5: QuickBooks payment sync) needs to record a payment
-- notification it CANNOT resolve to a known invoice -- "never mark paid solely from an
-- unresolvable signal, but never silently discard it either" mirrors the same principle already
-- applied to zelle_notifications.status (0015), which has 'unmatched' from the start. payments
-- (0012) didn't anticipate this case; add it the same safe way 0011 extended activity_log's check
-- constraint -- drop and recreate, additive, no data loss (existing rows all use the original
-- values, so the recreate is a no-op for them).
alter table payments drop constraint if exists payments_status_check;
alter table payments add constraint payments_status_check
  check (status in ('received','voided','refunded','disputed','unmatched'));
