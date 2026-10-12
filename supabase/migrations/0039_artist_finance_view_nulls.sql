-- 0039: Fix artist_finance_view NULL handling (0038 follow-up).
-- Applied: (not yet)
--
-- The 0038 isolation check (0038_test_artist_isolation.sql) failed on two real bugs, both in money:
--   1. is_shared was NULL, not false, for a gig with no app_doc.additionalArtists
--      (jsonb_typeof(NULL) = 'array' is NULL), so a solo gig got no money at all.
--   2. greatest(0, NULL) is 0 in Postgres (GREATEST ignores NULLs), so a shared gig's "no money yet"
--      showed as $0 instead of NULL -- the portal must show "being confirmed", never a number.
-- Same view, same columns; only these two expressions change. Clamping now happens only when
-- there is a figure.

begin;

create or replace view artist_finance_view with (security_barrier = true) as
with me as (select current_artist_id() as artist_id),
roster as (
  select e.id as event_id, e.artist_id from events e where e.artist_id is not null
  union
  select ea.event_id, ea.artist_id from event_artists ea
  union
  select e.id, a.id
  from events e
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(e.app_doc->'additionalArtists') = 'array' then e.app_doc->'additionalArtists' else '[]'::jsonb end) x
  join artists a on a.legacy_id = x->>'artistId' or a.id::text = x->>'artistId'
),
pairs as (
  select r.event_id, r.artist_id from roster r, me
  where me.artist_id is not null and r.artist_id = me.artist_id
)
select
  e.id                                   as event_id,
  e.legacy_id,
  p.artist_id,
  coalesce(e.title, e.type)              as title,
  e.client_name,
  e.date,
  e.status,
  s.is_shared                            as is_shared,
  -- Money: the artist's own event_artists row wins; a single-artist gig falls back to events;
  -- a shared gig without an own row has NULL money (never 0). Never negative.
  case when m.gross is not null then greatest(0, m.gross) end            as gross_amount,
  case when m.cut is not null then greatest(0, m.cut) end                as asp_cut,
  case when m.gross > 0 and m.cut is not null then round(m.cut / m.gross * 100, 2) end as asp_cut_pct,
  case when m.net is not null then greatest(0, m.net) end                as net_amount,
  coalesce(ea.expenses_charged, 0)       as expenses_charged,
  -- true when this is a shared gig with no per-artist money row yet: portal shows "being confirmed"
  (s.is_shared and ea.id is null)        as money_pending,
  -- event-level payment facts (client side), safe to show: no amounts of anyone else
  e.deposit_received,
  e.deposit_received_date,
  e.balance_received,
  e.balance_received_date,
  -- events.artist_paid_out is the PRIMARY artist's payout; nobody else's
  coalesce(e.artist_id = p.artist_id and e.artist_paid_out, false)         as paid_to_you,
  case when e.artist_id = p.artist_id then e.artist_paid_out_date end       as paid_to_you_date
from pairs p
join events e on e.id = p.event_id
left join event_artists ea on ea.event_id = e.id and ea.artist_id = p.artist_id
cross join lateral (select (
       coalesce(jsonb_typeof(e.app_doc->'additionalArtists') = 'array' and jsonb_array_length(e.app_doc->'additionalArtists') > 0, false)
    or e.artist_id is distinct from p.artist_id
    or exists (select 1 from event_artists o where o.event_id = e.id and o.artist_id <> p.artist_id)
  ) as is_shared) s
cross join lateral (select
    case when ea.id is not null then coalesce(ea.gross_fee, ea.fee_amount)
         when not s.is_shared then e.price end                as gross,
    case when ea.id is not null then ea.asp_cut
         when not s.is_shared then e.commission end           as cut,
    case when ea.id is not null then ea.net_amount
         when not s.is_shared then e.price - e.commission end as net
  ) m
where e.status in ('booked','paid')
  and e.booking_type = 'gig';

commit;
