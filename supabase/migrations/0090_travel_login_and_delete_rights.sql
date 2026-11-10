-- 0090: a travel-only login, and who may delete gigs (owner 2026-11-09: "Rivky = travel + gig info only";
-- "delete gigs: owner + Ilan only").
--
-- 1. Travel crew (crew_members.kind 'travel'). Like the social crew they are NOT office staff, so is_admin()
--    stays false and every office table -- prices, deposits, balances, payments, contracts, payees -- stays
--    closed by the existing RLS. They read:
--      - crew_gig_view: every booked / contract-sent gig, now with the travel columns appended (flight needed /
--        booked, flight, ground transport, the itinerary). Still no money column.
--      - crew_travel_view: the travel requests (who flies, where, when, class, hotel) -- no money in them.
--    They don't get the private video library (can_view_library: social + videographer crew only).
-- 2. Deleting a gig: only the owner (admin_coo) and Ilan (admin_ceo). Other office logins can still edit.
--
-- Who is travel crew is set with SQL outside the repo (emails are personal data; the repo is public).
--
-- Applied: 2026-11-10 (supabase/run-sql.sh)

begin;

alter table public.crew_members drop constraint if exists crew_members_kind_check;
alter table public.crew_members add constraint crew_members_kind_check check (kind in ('social', 'videographer', 'travel'));

create or replace function public.can_view_library() returns boolean
  language sql stable security definer set search_path = public
  as $$ select exists(select 1 from admin_users where user_id = auth.uid() and library_access)
            or exists(select 1 from crew_members where user_id = auth.uid() and active and kind in ('social', 'videographer')) $$;

create or replace view public.crew_gig_view with (security_barrier = true) as
with me as (select current_crew_id() as crew_id, current_crew_kind() as kind),
singers as (
  select e.id as event_id, a.legacy_id, a.id as artist_id, a.name, 0 as ord
    from events e join artists a on a.id = e.artist_id
  union all
  select e.id, a.legacy_id, a.id, a.name, x.ord
    from events e
    cross join lateral jsonb_array_elements(case when jsonb_typeof(e.app_doc -> 'additionalArtists') = 'array' then e.app_doc -> 'additionalArtists' else '[]'::jsonb end) with ordinality x(value, ord)
    join artists a on a.legacy_id = (x.value ->> 'artistId') or a.id::text = (x.value ->> 'artistId')
)
select e.id as event_id,
       e.legacy_id,
       coalesce(e.title, e.type) as title,
       e.type,
       case when e.status = 'contract_sent' then 'pending' else 'confirmed' end as status,
       e.date, e."time", e.end_time,
       e.client_name,
       e.venue,
       nullif(e.app_doc ->> 'address', '') as address,
       e.city, e.state,
       nullif(concat_ws(', ', nullif(e.venue, ''), nullif(e.app_doc ->> 'address', ''), nullif(e.city, ''), nullif(e.state, '')), '') as map_query,
       e.dress_code,
       nullif(e.app_doc ->> 'band', '') as band,
       e.app_doc -> 'gigInfoSheet' as gig_sheet,
       (select coalesce(jsonb_agg(jsonb_build_object('id', coalesce(s.legacy_id, s.artist_id::text), 'name', s.name) order by s.ord), '[]'::jsonb)
          from singers s where s.event_id = e.id) as singers,
       (select coalesce(jsonb_agg(jsonb_build_object('crewId', c.id, 'name', c.name, 'status', gc.status) order by gc.requested_at), '[]'::jsonb)
          from gig_crew gc join crew_members c on c.id = gc.crew_id
         where gc.event_id = e.id and (me.kind = 'social' or gc.crew_id = me.crew_id)) as crew,
       (select gc.status from gig_crew gc where gc.event_id = e.id and gc.crew_id = me.crew_id) as my_status,
       -- travel columns (0090): only the travel crew get them
       case when me.kind = 'travel' then e.flight_needed end as flight_needed,
       case when me.kind = 'travel' then e.flight_booked end as flight_booked,
       case when me.kind = 'travel' then e.flight end as flight,
       case when me.kind = 'travel' then e.ground_transport_needed end as ground_transport_needed,
       case when me.kind = 'travel' then e.ground_transport_booked end as ground_transport_booked,
       case when me.kind = 'travel' then e.ground_transport end as ground_transport,
       case when me.kind = 'travel' then e.app_doc -> 'travel' end as travel
  from events e, me
 where me.crew_id is not null
   and coalesce(e.unpaid, false) = false
   and e.status in ('contract_sent', 'booked', 'paid')
   and (me.kind in ('social', 'travel')
        or exists (select 1 from gig_crew gc where gc.event_id = e.id and gc.crew_id = me.crew_id and gc.status <> 'declined'));

revoke all on public.crew_gig_view from anon, authenticated;
grant select on public.crew_gig_view to authenticated, service_role;

create or replace view public.crew_travel_view with (security_barrier = true) as
  select r.legacy_id as id,
         r.app_doc ->> 'eventId' as event_id,
         r.app_doc ->> 'status' as status,
         r.app_doc -> 'details' as details,
         r.app_doc -> 'flightSegments' as flight_segments,
         r.app_doc ->> 'sentAt' as sent_at,
         r.app_doc ->> 'createdAt' as created_at
    from app_records r
   where r.collection = 'travel_requests'
     and (select current_crew_kind()) = 'travel';
revoke all on public.crew_travel_view from anon, authenticated;
grant select on public.crew_travel_view to authenticated, service_role;

create or replace function public.can_delete_gigs() returns boolean
  language sql stable security definer set search_path = public
  as $$ select is_admin() and exists(select 1 from admin_users where user_id = auth.uid() and role in ('admin_coo', 'admin_ceo')) $$;
revoke execute on function public.can_delete_gigs() from public, anon;
grant execute on function public.can_delete_gigs() to authenticated;

drop policy if exists "admin deletes events" on public.events;
create policy "owner and ceo delete events" on public.events for delete to authenticated using ((select can_delete_gigs()));

commit;
