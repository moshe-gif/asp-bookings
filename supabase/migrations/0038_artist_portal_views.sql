-- 0038: Artist portal on real data (draft for review - NOT applied).
-- Applied: (not yet)
--
-- Why: migration 0026 removed every artist SELECT policy on events (correct: RLS cannot hide
-- columns), and the app never switched the artist portal to artist_booking_view, so a signed-in
-- artist sees no real gigs or money today (shared sync is admin-only). This adds two scoped views
-- the portal reads instead. Same security-barrier pattern as 0026: the view runs as its owner,
-- and the access boundary is the join to current_artist_id() inside the view.
--
-- Owner decisions encoded here (2026-10-11, as relayed to the task agent by Instinct's main agent from Moshe's WhatsApp voice notes; the task agent did not hear the notes - Moshe please confirm):
--   * Artist sees client name/phone/email, venue, time, logistics for THEIR gigs.
--   * Artist sees the gig amount, the ASP percentage and their net.
--   * "An artist never owes": no view exposes an owed/negative/receivable column. Whatever ASP
--     is owed stays in admin-only tables.
-- Still hidden from artists: contracts, invoices, ASP profit, other artists' fees/travel/payouts,
-- payee/bank details, internal notes.
--
-- Shared (multi-artist) gigs: events.price/commission are event-level, so showing them would leak
-- other singers' money. For a shared gig the artist's money comes ONLY from event_artists (0012/0021:
-- per-artist fee_amount/asp_cut/net_amount). If that row is missing, money columns are NULL and
-- money_pending = true (the portal shows "amount being confirmed"). Never inferred.
--
-- AMENDED by the task agent (2026-10-11), review before applying:
--   * The app records a gig's extra performers inside the gig document (app_doc.additionalArtists,
--     [{artistId, feeAmount}]); nothing writes event_artists (0 rows live). Detecting "shared" from
--     event_artists alone would treat every package gig as single-artist and show the PRIMARY
--     artist the full package price/commission -- the other singers' money. The performer roster
--     below is therefore primary artist + event_artists + app_doc.additionalArtists; a gig is
--     shared when that roster has more than one artist. Money rule unchanged: shared gigs take
--     money only from the artist's own event_artists row, else money_pending.
--   * The same roster lets an additional artist see the gig at all (logistics, co-performers;
--     no travel, no money until their event_artists row exists).
--   * co_performers role falls back to the roster role (artists.role) when there's no event_artists row.
--   * "Shared" is decided from the gig itself, not only from performers the roster could match: any
--     entry in app_doc.additionalArtists (even one with no artists row, e.g. an outside act), any
--     other artist's event_artists row, or the viewer not being the primary artist. Otherwise an
--     unmatched co-performer, or a gig whose primary has no artists row, would read as single-artist
--     and show the package money.
--   * paid_to_you is events.artist_paid_out, which is about the PRIMARY artist's payout: only the
--     primary sees it (others get false / null until a per-artist payout field exists).
--   * Money columns are clamped at 0 (greatest), so a data error can never surface as a negative.
--   * Security Advisor: these are owner-run ("security definer") views, the pattern 0031 replaced for
--     artist_booking_view with the function artist_bookings() because the Advisor reports it as an
--     ERROR. Kept as views per the task spec; expect that Advisor ERROR for both. Switching to two
--     security definer functions (supabase.rpc) is a small follow-up if the owner prefers.
--
-- Rollout order: apply this file, then run 0038_test_artist_isolation.sql (ends in rollback).

begin;

-- ---------------------------------------------------------------------------------------------
-- Which (event, artist) pairs belong to the signed-in artist: primary artist on the event, a row
-- in event_artists, or an entry in the gig document's additionalArtists. Dedupes (union).
-- ---------------------------------------------------------------------------------------------
create or replace view artist_gig_view with (security_barrier = true) as
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
  e.id                                  as event_id,
  e.legacy_id,
  p.artist_id,
  e.booking_type,
  coalesce(e.title, e.type)             as title,
  e.type,
  e.status,
  e.booking_status,
  e.date,
  e.time,
  e.end_time,
  -- client + place: explicitly allowed for the artist (owner decision 2026-10-11)
  e.client_name,
  e.client_phone,
  e.client_email,
  e.venue,
  nullif(e.app_doc->>'address','')      as address,
  e.city,
  e.state,
  -- one string for the portal to build Waze / Google Maps links from (URL-encoding is done in JS)
  nullif(concat_ws(', ',
    nullif(e.venue,''), nullif(e.app_doc->>'address',''), nullif(e.city,''), nullif(e.state,'')), '') as map_query,
  e.dress_code,
  nullif(e.app_doc->>'band','')         as band,
  nullif(e.app_doc->>'bandSize','')     as band_size,
  -- travel: event-level jsonb. Only the PRIMARY artist gets it; on a shared gig a non-primary
  -- artist gets none until per-artist travel exists (0026 did the same for itineraries).
  (e.artist_id = p.artist_id)           as is_primary,
  case when e.artist_id = p.artist_id then e.flight_needed end            as flight_needed,
  case when e.artist_id = p.artist_id then e.flight_booked end            as flight_booked,
  case when e.artist_id = p.artist_id then e.flight end                   as flight,
  case when e.artist_id = p.artist_id then e.ground_transport_needed end  as ground_transport_needed,
  case when e.artist_id = p.artist_id then e.ground_transport_booked end  as ground_transport_booked,
  case when e.artist_id = p.artist_id then e.ground_transport end         as ground_transport,
  -- shared gig: co-performer names + role only, never their numbers
  (select coalesce(jsonb_agg(jsonb_build_object('name', a.name, 'role', coalesce(ea2.role, a.role)) order by a.name), '[]'::jsonb)
     from (select distinct r.artist_id from roster r where r.event_id = e.id and r.artist_id <> p.artist_id) o
     join artists a on a.id = o.artist_id
     left join event_artists ea2 on ea2.event_id = e.id and ea2.artist_id = o.artist_id) as co_performers
from pairs p
join events e on e.id = p.event_id
where e.status in ('booked','paid')          -- artists do not see leads / unsigned / negotiating
  and e.booking_type = 'gig';

grant select on artist_gig_view to authenticated;
revoke all on artist_gig_view from anon;

-- ---------------------------------------------------------------------------------------------
-- Money, one row per (event, artist). No owes state: nothing here can be negative or a receivable.
-- ---------------------------------------------------------------------------------------------
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
  s.is_shared           as is_shared,
  -- Money: event_artists wins when present; otherwise single-artist gigs fall back to events.
  greatest(0, case when ea.id is not null then coalesce(ea.gross_fee, ea.fee_amount)
       when not s.is_shared then e.price end)                         as gross_amount,
  greatest(0, case when ea.id is not null then ea.asp_cut
       when not s.is_shared then e.commission end)                    as asp_cut,
  case when ea.id is not null and coalesce(ea.gross_fee, ea.fee_amount) > 0
         then round(ea.asp_cut / coalesce(ea.gross_fee, ea.fee_amount) * 100, 2)
       when ea.id is null and not s.is_shared and e.price > 0
         then round(e.commission / e.price * 100, 2) end                              as asp_cut_pct,
  greatest(0, case when ea.id is not null then ea.net_amount
       when not s.is_shared then e.price - e.commission end)          as net_amount,
  coalesce(ea.expenses_charged, 0)       as expenses_charged,
  -- true when this is a shared gig with no per-artist money row yet: portal shows "being confirmed"
  (s.is_shared and ea.id is null) as money_pending,
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
       (jsonb_typeof(e.app_doc->'additionalArtists') = 'array' and jsonb_array_length(e.app_doc->'additionalArtists') > 0)
    or e.artist_id is distinct from p.artist_id
    or exists (select 1 from event_artists o where o.event_id = e.id and o.artist_id <> p.artist_id)
  ) as is_shared) s
where e.status in ('booked','paid')
  and e.booking_type = 'gig';

grant select on artist_finance_view to authenticated;
revoke all on artist_finance_view from anon;

comment on view artist_gig_view is '0038: signed-in artist''s own booked gigs incl. client/venue/logistics. No money.';
comment on view artist_finance_view is '0038: signed-in artist''s own money per gig. No owes state. Shared gigs: own event_artists row only.';

commit;
