-- 0047: Artists see their office days too (owner, 2026-10-12).
-- Applied: 2026-10-12 (supabase/run-sql.sh; isolation check ALL OK incl. an office-day fixture)
--
-- "Artists should not see leads; they should see office days." artist_gig_view now also returns the
-- artist's internal days (events.unpaid: Recording Day, Filming Day, Rehearsal, Studio Session,
-- Unavailable...) so they're on the artist's calendar, plus an `unpaid` column (added at the end, as
-- CREATE OR REPLACE VIEW requires). Leads and unsigned gigs stay hidden. artist_finance_view is
-- unchanged: office days carry no money.

begin;

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
     left join event_artists ea2 on ea2.event_id = e.id and ea2.artist_id = o.artist_id) as co_performers,
  e.unpaid                              -- office day (recording day, rehearsal...): no client, no money
from pairs p
join events e on e.id = p.event_id
where (e.status in ('booked','paid') or e.unpaid)   -- never leads / contract sent / negotiating
  and e.booking_type = 'gig';

commit;
