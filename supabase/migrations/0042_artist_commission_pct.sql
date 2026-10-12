-- 0042: Each artist's ASP commission percentage (2026-10-09 audit W2-2 / 3.8).
-- Applied: 2026-10-12 (Supabase Management API, verified: all 15, dovie 10)
--
-- Owner decision 2026-10-12: commission is 15% except Dovie Nueberger at 10%. The rate lives on the
-- artist (the roster's one owner since 0037), is editable in Settings -> Users, and the app uses it
-- to prefill a gig's commission (standardCommission). Each gig still stores its own commission, so
-- changing a rate never rewrites existing gigs; the artist portal shows each gig's own percentage.

begin;
alter table artists add column if not exists commission_pct numeric not null default 15
  check (commission_pct >= 0 and commission_pct <= 100);
update artists set commission_pct = 10 where legacy_id = 'dovie';
commit;
