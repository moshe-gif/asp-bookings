-- 0066: the artist's gig info shows what to collect at the event (owner 2026-10-27: "in regards to the
-- singers alert, it should just be part of what they see in gig info"). Three columns appended to
-- artist_gig_view (CREATE OR REPLACE VIEW only allows adding at the end): collect_method (cash / check /
-- other), collect_note, collect_amount -- only for the gig's MAIN artist, on a booked gig paid another way
-- (paymentMethod not standard, e.g. Mezumin) whose balance isn't received yet.
-- collect_amount is the client's balance, the same figure as clientBalanceDue() in the app and
-- clientOwedCentsOf() in _shared/connect.ts (keep the three in step): every artist's fee + the gig's
-- charges, less the deposit -- ev.depositPaid once received, else the newest signed/sent/live contract's
-- deposit, else ASP's cut from every artist. One difference: with no deposit received yet, nothing is
-- taken off -- the artist collects the whole amount. NULL when an additional artist's figures are missing.
-- The rest of the view is the live definition (0047 + 0060), unchanged.
-- Applied: 2026-10-27

begin;

-- A number from a jsonb text value, or NULL (never an error: one bad value must not break the view).
create or replace function public.asp_num(v text) returns numeric
language sql immutable set search_path = '' as $$
  select case when btrim(v) ~ '^-?[0-9]+(\.[0-9]+)?$' then btrim(v)::numeric end
$$;

create or replace view public.artist_gig_view with (security_barrier = true) as
 WITH me AS (
         SELECT current_artist_id() AS artist_id
        ), roster AS (
         SELECT e_1.id AS event_id,
            e_1.artist_id
           FROM events e_1
          WHERE e_1.artist_id IS NOT NULL
        UNION
         SELECT ea.event_id,
            ea.artist_id
           FROM event_artists ea
        UNION
         SELECT e_1.id,
            a.id
           FROM events e_1
             CROSS JOIN LATERAL jsonb_array_elements(
                CASE
                    WHEN jsonb_typeof(e_1.app_doc -> 'additionalArtists'::text) = 'array'::text THEN e_1.app_doc -> 'additionalArtists'::text
                    ELSE '[]'::jsonb
                END) x(value)
             JOIN artists a ON a.legacy_id = (x.value ->> 'artistId'::text) OR a.id::text = (x.value ->> 'artistId'::text)
        ), pairs AS (
         SELECT r.event_id,
            r.artist_id
           FROM roster r,
            me
          WHERE me.artist_id IS NOT NULL AND r.artist_id = me.artist_id
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
    NULLIF(e.app_doc ->> 'address'::text, ''::text) AS address,
    e.city,
    e.state,
    NULLIF(concat_ws(', '::text, NULLIF(e.venue, ''::text), NULLIF(e.app_doc ->> 'address'::text, ''::text), NULLIF(e.city, ''::text), NULLIF(e.state, ''::text)), ''::text) AS map_query,
    e.dress_code,
    NULLIF(e.app_doc ->> 'band'::text, ''::text) AS band,
    NULLIF(e.app_doc ->> 'bandSize'::text, ''::text) AS band_size,
    e.artist_id = p.artist_id AS is_primary,
        CASE
            WHEN e.artist_id = p.artist_id THEN e.flight_needed
            ELSE NULL::boolean
        END AS flight_needed,
        CASE
            WHEN e.artist_id = p.artist_id THEN e.flight_booked
            ELSE NULL::boolean
        END AS flight_booked,
        CASE
            WHEN e.artist_id = p.artist_id THEN e.flight
            ELSE NULL::jsonb
        END AS flight,
        CASE
            WHEN e.artist_id = p.artist_id THEN e.ground_transport_needed
            ELSE NULL::boolean
        END AS ground_transport_needed,
        CASE
            WHEN e.artist_id = p.artist_id THEN e.ground_transport_booked
            ELSE NULL::boolean
        END AS ground_transport_booked,
        CASE
            WHEN e.artist_id = p.artist_id THEN e.ground_transport
            ELSE NULL::jsonb
        END AS ground_transport,
    ( SELECT COALESCE(jsonb_agg(jsonb_build_object('name', a.name, 'role', COALESCE(ea2.role, a.role)) ORDER BY a.name), '[]'::jsonb) AS "coalesce"
           FROM ( SELECT DISTINCT r.artist_id
                   FROM roster r
                  WHERE r.event_id = e.id AND r.artist_id <> p.artist_id) o
             JOIN artists a ON a.id = o.artist_id
             LEFT JOIN event_artists ea2 ON ea2.event_id = e.id AND ea2.artist_id = o.artist_id) AS co_performers,
    e.unpaid,
        CASE
            WHEN e.artist_id = p.artist_id THEN e.app_doc -> 'travel'::text
            ELSE NULL::jsonb
        END AS travel,
    e.app_doc -> 'gigInfoSheet'::text AS gig_sheet,
    -- 0066: what the artist collects at the event when the gig isn't paid the standard way (Mezumin = cash).
    -- Main artist only, booked and balance not yet received.
        CASE WHEN m.collect THEN e.app_doc ->> 'paymentMethod'::text END AS collect_method,
        CASE WHEN m.collect THEN NULLIF(e.app_doc ->> 'paymentMethodNote'::text, ''::text) END AS collect_note,
        CASE WHEN m.collect AND NOT m.extras_missing THEN m.price + m.charges + m.extra_fees - m.deposit END AS collect_amount
   FROM pairs p
     JOIN events e ON e.id = p.event_id
     LEFT JOIN LATERAL ( SELECT k.app_doc AS c
           FROM app_records k
          WHERE k.collection = 'contracts'::text AND (k.app_doc ->> 'leadId'::text) = e.legacy_id AND COALESCE(k.app_doc ->> 'status'::text, ''::text) <> 'void'::text
          ORDER BY (CASE k.app_doc ->> 'status'::text WHEN 'signed'::text THEN 0 WHEN 'sent'::text THEN 1 ELSE 2 END), (k.app_doc ->> 'createdAt'::text) DESC
         LIMIT 1) ct ON true
     CROSS JOIN LATERAL ( SELECT x.*,
            CASE
                WHEN NOT COALESCE((e.app_doc ->> 'depositReceived'::text) = 'true'::text, false) THEN 0::numeric
                WHEN x.paid > 0::numeric THEN x.paid
                WHEN x.contract_dep > 0::numeric THEN x.contract_dep
                ELSE x.commission + x.extra_cuts
            END AS deposit
           FROM ( SELECT e.artist_id = p.artist_id AND e.status = 'booked'::text
                    AND COALESCE((e.app_doc ->> 'balanceReceived'::text) <> 'true'::text, true)
                    AND COALESCE(e.app_doc ->> 'paymentMethod'::text, 'standard'::text) <> 'standard'::text AS collect,
                    COALESCE(asp_num(e.app_doc ->> 'price'::text), 0::numeric) AS price,
                    COALESCE(asp_num(e.app_doc ->> 'commission'::text), 0::numeric) AS commission,
                    COALESCE(asp_num(e.app_doc ->> 'depositPaid'::text), 0::numeric) AS paid,
                    ( SELECT COALESCE(sum(COALESCE(asp_num(ch.value ->> 'amount'::text), 0::numeric)), 0::numeric)
                           FROM jsonb_array_elements(CASE WHEN jsonb_typeof(e.app_doc -> 'charges'::text) = 'array'::text THEN e.app_doc -> 'charges'::text ELSE '[]'::jsonb END) ch(value)) AS charges,
                    ( SELECT COALESCE(sum(COALESCE(asp_num(xa.value ->> 'feeAmount'::text), 0::numeric)), 0::numeric)
                           FROM jsonb_array_elements(CASE WHEN jsonb_typeof(e.app_doc -> 'additionalArtists'::text) = 'array'::text THEN e.app_doc -> 'additionalArtists'::text ELSE '[]'::jsonb END) xa(value)
                          WHERE COALESCE(xa.value ->> 'artistId'::text, ''::text) <> ''::text) AS extra_fees,
                    ( SELECT COALESCE(sum(COALESCE(asp_num(xa.value ->> 'aspCut'::text), 0::numeric)), 0::numeric)
                           FROM jsonb_array_elements(CASE WHEN jsonb_typeof(e.app_doc -> 'additionalArtists'::text) = 'array'::text THEN e.app_doc -> 'additionalArtists'::text ELSE '[]'::jsonb END) xa(value)
                          WHERE COALESCE(xa.value ->> 'artistId'::text, ''::text) <> ''::text) AS extra_cuts,
                    ( SELECT COALESCE(bool_or(asp_num(xa.value ->> 'aspCut'::text) IS NULL OR asp_num(xa.value ->> 'feeAmount'::text) IS NULL), false)
                           FROM jsonb_array_elements(CASE WHEN jsonb_typeof(e.app_doc -> 'additionalArtists'::text) = 'array'::text THEN e.app_doc -> 'additionalArtists'::text ELSE '[]'::jsonb END) xa(value)
                          WHERE COALESCE(xa.value ->> 'artistId'::text, ''::text) <> ''::text) AS extras_missing,
                    CASE
                        WHEN (ct.c -> 'fee'::text) IS NULL OR (ct.c -> 'deposit'::text) IS NULL THEN 0::numeric
                        WHEN COALESCE(asp_num((ct.c -> 'deposit'::text) ->> 'percent'::text), 0::numeric) > 0::numeric
                          THEN round(COALESCE(asp_num((ct.c -> 'fee'::text) ->> 'amount'::text), 0::numeric) * asp_num((ct.c -> 'deposit'::text) ->> 'percent'::text) / 100::numeric)
                        ELSE COALESCE(asp_num((ct.c -> 'deposit'::text) ->> 'amount'::text), 0::numeric)
                    END AS contract_dep) x) m
  WHERE ((e.status = ANY (ARRAY['booked'::text, 'paid'::text])) OR e.unpaid) AND e.booking_type = 'gig'::text;

commit;
