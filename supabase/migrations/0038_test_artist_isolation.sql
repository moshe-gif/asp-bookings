-- 0038 isolation test. Run in Supabase SQL editor AFTER 0038_artist_portal_views.sql, 0039, 0043 and 0047.
-- Not a migration: a check you run by hand. Applied: n/a (writes nothing).
--
-- The whole test is ONE statement (a DO block) that always ends by raising an exception, so
-- Postgres rolls back everything it did (fixtures included) and the SQL editor shows the results
-- as the error text: the first line says "ALL OK" or "FAILED", then one line per check:
--   ok   | <artist> | <check> | <detail>
--   FAIL | <artist> | <check> | <detail>
-- Any FAIL = do not ship. (A plain `select ... ; rollback;` would show nothing: the editor only
-- displays the last statement's result.)
--
-- It impersonates each artist that has a login (artists.user_id set) and checks:
--   1. artist cannot read base tables (events, event_artists other than own, payments, contracts,
--      app_records) directly
--   2. artist_gig_view / artist_finance_view return EXACTLY that artist's booked/paid gigs (the
--      expected set is computed from the gig documents as superuser before switching role)
--   3. no row shows money for a shared gig without the artist's own event_artists row
--   4. no negative / owes amounts; co-performers carry name + role only
-- Fictional fixture gigs make the checks meaningful while the real events table is empty:
--   EV-ISO-1  benny solo, booked, $10,000 / $1,000                 -> benny: money, 10%
--   EV-ISO-2  benny primary + eli (additionalArtists), $20,000 package, flight;
--             eli has an event_artists row ($9,000 / $900 / $8,100, role 'Harmony')
--             -> benny: no money (no own row), travel, co-performer Eli (Harmony)
--             -> eli: own money only (10%), no travel, not "paid to you"
--   EV-ISO-3  benny, lead                                        -> nobody
--   EV-ISO-4  eli solo, paid, $8,000                             -> eli only
--   EV-ISO-5  benny primary + an outside act with no artists row -> benny: shared, no money
--   EV-ISO-6  benny alone, but priceScope 'Client package' (0043)  -> benny: no money
--   EV-ISO-7  benny office day (Recording Day, unpaid; 0047)        -> benny sees it, no money row
-- Inserting into events also queues the axis_sync_events webhook, but pg_net only sends after
-- COMMIT, and this statement never commits.

do $$
declare
  a record;
  n int;
  m int;
  expected uuid[];
  expected_money uuid[];
  all_ok boolean := true;
  res text := '';
  eli_id uuid := (select id from artists where legacy_id = 'eli');
begin
  -- fixtures (rolled back with everything else)
  insert into events (app_doc) values
    ('{"id":"EV-ISO-1","artistId":"benny","status":"booked","type":"Wedding","date":"2099-01-01","time":"18:00","price":10000,"commission":1000,"clientName":"Isolation Client One","venue":"Iso Hall","city":"Lakewood","state":"NJ"}'),
    ('{"id":"EV-ISO-2","artistId":"benny","additionalArtists":[{"artistId":"eli","feeAmount":9000}],"status":"booked","type":"Wedding","date":"2099-01-02","time":"18:00","price":20000,"commission":3000,"clientName":"Isolation Client Two","artistPaidOut":true,"artistPaidOutDate":"2099-01-03","flightNeeded":true,"flightBooked":true,"flight":{"airline":"Iso Air","confirmation":"ISO123"}}'),
    ('{"id":"EV-ISO-3","artistId":"benny","status":"lead","type":"Bar Mitzvah","date":"2099-01-03","price":5000,"commission":750,"clientName":"Isolation Lead"}'),
    ('{"id":"EV-ISO-4","artistId":"eli","status":"paid","type":"Concert","date":"2099-01-04","price":8000,"commission":800,"clientName":"Isolation Client Four"}'),
    ('{"id":"EV-ISO-5","artistId":"benny","additionalArtists":[{"artistId":"outside-act-not-on-roster","feeAmount":4000}],"status":"booked","type":"Wedding","date":"2099-01-05","price":15000,"commission":2250,"clientName":"Isolation Client Five"}'),
    ('{"id":"EV-ISO-6","artistId":"benny","priceScope":"Client package","status":"booked","type":"Concert","date":"2099-01-06","price":59000,"commission":0,"clientName":"Isolation Client Six"}'),
    ('{"id":"EV-ISO-7","artistId":"benny","unpaid":true,"status":"scheduled","type":"Recording Day","date":"2099-01-07","price":0,"commission":0}');
  if eli_id is not null then
    insert into event_artists (event_id, artist_id, role, fee_amount, asp_cut, net_amount)
    select id, eli_id, 'Harmony', 9000, 900, 8100 from events where legacy_id = 'EV-ISO-2';
  end if;

  n := (select count(*) from artists where legacy_id in ('benny','eli') and user_id is not null);
  all_ok := all_ok and n = 2;
  res := res || format(E'\n%s | - | fixture artists benny + eli have logins | found=%s', case when n = 2 then 'ok  ' else 'FAIL' end, n);

  for a in select id, name, user_id, legacy_id from artists where user_id is not null order by name loop
    -- what this artist SHOULD see, from the gig documents, as superuser
    select coalesce(array_agg(e.id), '{}') into expected from events e
     where (e.status in ('booked','paid') or e.unpaid) and e.booking_type = 'gig'
       and (e.artist_id = a.id
            or exists (select 1 from event_artists ea where ea.event_id = e.id and ea.artist_id = a.id)
            or exists (select 1 from jsonb_array_elements(case when jsonb_typeof(e.app_doc->'additionalArtists') = 'array'
                                                               then e.app_doc->'additionalArtists' else '[]'::jsonb end) x
                        where x->>'artistId' in (a.legacy_id, a.id::text)));
    select coalesce(array_agg(e.id), '{}') into expected_money from events e
     where e.id = any(expected) and e.status in ('booked','paid');

    perform set_config('request.jwt.claims', json_build_object('sub', a.user_id, 'role', 'authenticated')::text, true);
    set local role authenticated;

    -- 1. base tables are closed to artists
    n := (select count(*) from events);
    all_ok := all_ok and n = 0; res := res || format(E'\n%s | %s | events direct read is empty | rows=%s', case when n = 0 then 'ok  ' else 'FAIL' end, a.name, n);
    n := (select count(*) from event_artists where artist_id <> a.id);
    all_ok := all_ok and n = 0; res := res || format(E'\n%s | %s | event_artists: no other artist''s rows | rows=%s', case when n = 0 then 'ok  ' else 'FAIL' end, a.name, n);
    n := (select count(*) from payments);
    all_ok := all_ok and n = 0; res := res || format(E'\n%s | %s | payments direct read is empty | rows=%s', case when n = 0 then 'ok  ' else 'FAIL' end, a.name, n);
    n := (select count(*) from contracts);
    all_ok := all_ok and n = 0; res := res || format(E'\n%s | %s | contracts direct read is empty | rows=%s', case when n = 0 then 'ok  ' else 'FAIL' end, a.name, n);
    n := (select count(*) from app_records);
    all_ok := all_ok and n = 0; res := res || format(E'\n%s | %s | app_records direct read is empty | rows=%s', case when n = 0 then 'ok  ' else 'FAIL' end, a.name, n);

    -- 2. views contain exactly this artist's gigs
    n := (select count(*) from artist_gig_view where not (event_id = any(expected)));
    m := (select count(*) from unnest(expected) x where x not in (select event_id from artist_gig_view));
    all_ok := all_ok and n = 0 and m = 0;
    res := res || format(E'\n%s | %s | gig view = exactly own gigs | foreign=%s missing=%s', case when n = 0 and m = 0 then 'ok  ' else 'FAIL' end, a.name, n, m);
    n := (select count(*) from artist_finance_view where not (event_id = any(expected_money)));
    m := (select count(*) from unnest(expected_money) x where x not in (select event_id from artist_finance_view));
    all_ok := all_ok and n = 0 and m = 0;
    res := res || format(E'\n%s | %s | finance view = exactly own gigs | foreign=%s missing=%s', case when n = 0 and m = 0 then 'ok  ' else 'FAIL' end, a.name, n, m);

    -- 3. shared gigs: money only from the artist's own event_artists row
    n := (select count(*) from artist_finance_view f
           where f.is_shared and f.gross_amount is not null
             and not exists (select 1 from event_artists ea where ea.event_id = f.event_id and ea.artist_id = a.id));
    all_ok := all_ok and n = 0; res := res || format(E'\n%s | %s | shared gig money only from own row | leaked=%s', case when n = 0 then 'ok  ' else 'FAIL' end, a.name, n);

    -- 4. no owes; co-performers are name + role only
    n := (select count(*) from artist_finance_view where coalesce(net_amount,0) < 0 or coalesce(asp_cut,0) < 0 or coalesce(gross_amount,0) < 0);
    all_ok := all_ok and n = 0; res := res || format(E'\n%s | %s | no negative / owes amounts | bad=%s', case when n = 0 then 'ok  ' else 'FAIL' end, a.name, n);
    n := (select count(*) from artist_gig_view g, jsonb_array_elements(g.co_performers) c where (c - 'name' - 'role') <> '{}'::jsonb);
    all_ok := all_ok and n = 0; res := res || format(E'\n%s | %s | co-performers are name + role only | extra keys=%s', case when n = 0 then 'ok  ' else 'FAIL' end, a.name, n);

    -- 5. fixture expectations
    if a.legacy_id = 'benny' then
      n := (select count(*) from artist_gig_view where legacy_id = 'EV-ISO-7' and unpaid)
         + (select count(*) from artist_finance_view where legacy_id = 'EV-ISO-7');
      all_ok := all_ok and n = 1; res := res || format(E'\n%s | %s | fixture: office day visible, no money row | n=%s', case when n = 1 then 'ok  ' else 'FAIL' end, a.name, n);
      n := (select count(*) from artist_finance_view where legacy_id = 'EV-ISO-1' and gross_amount = 10000 and asp_cut = 1000 and asp_cut_pct = 10 and net_amount = 9000 and not money_pending);
      all_ok := all_ok and n = 1; res := res || format(E'\n%s | %s | fixture: solo gig money + 10%% | rows=%s', case when n = 1 then 'ok  ' else 'FAIL' end, a.name, n);
      n := (select count(*) from artist_finance_view where legacy_id in ('EV-ISO-2','EV-ISO-5','EV-ISO-6') and is_shared and money_pending and gross_amount is null and net_amount is null);
      all_ok := all_ok and n = 3; res := res || format(E'\n%s | %s | fixture: no package money (incl. outside act, package scope) | rows=%s', case when n = 3 then 'ok  ' else 'FAIL' end, a.name, n);
      n := (select count(*) from artist_gig_view where legacy_id = 'EV-ISO-2' and is_primary and flight is not null
              and co_performers = (select jsonb_build_array(jsonb_build_object('name', x.name, 'role', 'Harmony')) from artists x where x.legacy_id = 'eli'));
      all_ok := all_ok and n = 1; res := res || format(E'\n%s | %s | fixture: primary gets travel + co-performer name/role | rows=%s', case when n = 1 then 'ok  ' else 'FAIL' end, a.name, n);
    elsif a.legacy_id = 'eli' then
      n := (select count(*) from artist_gig_view where legacy_id = 'EV-ISO-2' and not is_primary and flight is null and flight_needed is null and ground_transport is null);
      all_ok := all_ok and n = 1; res := res || format(E'\n%s | %s | fixture: non-primary gets no travel | rows=%s', case when n = 1 then 'ok  ' else 'FAIL' end, a.name, n);
      n := (select count(*) from artist_finance_view where legacy_id = 'EV-ISO-2' and not money_pending and gross_amount = 9000 and asp_cut = 900 and net_amount = 8100 and asp_cut_pct = 10 and not paid_to_you);
      all_ok := all_ok and n = 1; res := res || format(E'\n%s | %s | fixture: own row money only, not primary''s payout | rows=%s', case when n = 1 then 'ok  ' else 'FAIL' end, a.name, n);
    end if;

    reset role;
  end loop;

  -- anon / signed-out must see nothing
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    perform 1 from artist_gig_view limit 1;
    all_ok := false; res := res || E'\nFAIL | - | anon blocked on gig view | anon could select';
  exception when insufficient_privilege then
    res := res || E'\nok   | - | anon blocked on gig view | permission denied';
  end;
  begin
    perform 1 from artist_finance_view limit 1;
    all_ok := false; res := res || E'\nFAIL | - | anon blocked on finance view | anon could select';
  exception when insufficient_privilege then
    res := res || E'\nok   | - | anon blocked on finance view | permission denied';
  end;
  reset role;

  raise exception E'ARTIST ISOLATION: %  (rolled back, nothing written)%',
    case when all_ok then 'ALL OK' else 'FAILED' end, res;
end $$;
