-- Artist itinerary (owner 2026-10-15: "a box that will have a itinerary on the artist end ... they can just
-- click on their itinerary and see all of their information"). Two columns appended to artist_gig_view:
--  - travel: every flight, hotel and car the office saved (ev.travel), for the artist who travels (primary
--    only, the same rule as flight / ground_transport -- a co-performer never sees another's travel);
--  - gig_sheet: the gig's info sheet (lineup, run of the night, songs, contacts, notes) for everyone on the gig.
-- No money columns. Same view otherwise (definition taken from the live 0047 view).
-- Applied: 2026-10-15 (Management API).

create or replace view public.artist_gig_view with (security_barrier = true) as
WITH me AS (
         SELECT current_artist_id() AS artist_id
        ), roster AS (
         SELECT e_1.id AS event_id,
            e_1.artist_id
           FROM events e_1
          WHERE (e_1.artist_id IS NOT NULL)
        UNION
         SELECT ea.event_id,
            ea.artist_id
           FROM event_artists ea
        UNION
         SELECT e_1.id,
            a.id
           FROM ((events e_1
             CROSS JOIN LATERAL jsonb_array_elements(
                CASE
                    WHEN (jsonb_typeof((e_1.app_doc -> 'additionalArtists'::text)) = 'array'::text) THEN (e_1.app_doc -> 'additionalArtists'::text)
                    ELSE '[]'::jsonb
                END) x(value))
             JOIN artists a ON (((a.legacy_id = (x.value ->> 'artistId'::text)) OR ((a.id)::text = (x.value ->> 'artistId'::text)))))
        ), pairs AS (
         SELECT r.event_id,
            r.artist_id
           FROM roster r,
            me
          WHERE ((me.artist_id IS NOT NULL) AND (r.artist_id = me.artist_id))
        )
 SELECT e.id AS event_id,
    e.legacy_id,
    p.artist_id,
    e.booking_type,
    COALESCE(e.title, e.type) AS title,
    e.type,
    e.status,
    e.booking_status,
    e.date,
    e."time",
    e.end_time,
    e.client_name,
    e.client_phone,
    e.client_email,
    e.venue,
    NULLIF((e.app_doc ->> 'address'::text), ''::text) AS address,
    e.city,
    e.state,
    NULLIF(concat_ws(', '::text, NULLIF(e.venue, ''::text), NULLIF((e.app_doc ->> 'address'::text), ''::text), NULLIF(e.city, ''::text), NULLIF(e.state, ''::text)), ''::text) AS map_query,
    e.dress_code,
    NULLIF((e.app_doc ->> 'band'::text), ''::text) AS band,
    NULLIF((e.app_doc ->> 'bandSize'::text), ''::text) AS band_size,
    (e.artist_id = p.artist_id) AS is_primary,
        CASE
            WHEN (e.artist_id = p.artist_id) THEN e.flight_needed
            ELSE NULL::boolean
        END AS flight_needed,
        CASE
            WHEN (e.artist_id = p.artist_id) THEN e.flight_booked
            ELSE NULL::boolean
        END AS flight_booked,
        CASE
            WHEN (e.artist_id = p.artist_id) THEN e.flight
            ELSE NULL::jsonb
        END AS flight,
        CASE
            WHEN (e.artist_id = p.artist_id) THEN e.ground_transport_needed
            ELSE NULL::boolean
        END AS ground_transport_needed,
        CASE
            WHEN (e.artist_id = p.artist_id) THEN e.ground_transport_booked
            ELSE NULL::boolean
        END AS ground_transport_booked,
        CASE
            WHEN (e.artist_id = p.artist_id) THEN e.ground_transport
            ELSE NULL::jsonb
        END AS ground_transport,
    ( SELECT COALESCE(jsonb_agg(jsonb_build_object('name', a.name, 'role', COALESCE(ea2.role, a.role)) ORDER BY a.name), '[]'::jsonb) AS "coalesce"
           FROM ((( SELECT DISTINCT r.artist_id
                   FROM roster r
                  WHERE ((r.event_id = e.id) AND (r.artist_id <> p.artist_id))) o
             JOIN artists a ON ((a.id = o.artist_id)))
             LEFT JOIN event_artists ea2 ON (((ea2.event_id = e.id) AND (ea2.artist_id = o.artist_id))))) AS co_performers,
    e.unpaid,
        CASE
            WHEN (e.artist_id = p.artist_id) THEN (e.app_doc -> 'travel'::text)
            ELSE NULL::jsonb
        END AS travel,
    (e.app_doc -> 'gigInfoSheet'::text) AS gig_sheet
   FROM (pairs p
     JOIN events e ON ((e.id = p.event_id)))
  WHERE (((e.status = ANY (ARRAY['booked'::text, 'paid'::text])) OR e.unpaid) AND (e.booking_type = 'gig'::text));
