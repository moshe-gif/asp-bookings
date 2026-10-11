-- 0031: RLS leak fixes + Supabase Security Advisor fixes (2026-10-09 audit, issues 1.1, 1.3, 1.5, 1.6).
-- Applied: 2026-10-10 (Supabase Management API, verified)
--
-- 1) payee_profiles (0010): "read payee profiles" was `auth.uid() is not null`, so every signed-in
--    user -- every artist -- could read every payee's wire/routing/Zelle details. Only admins read
--    or write payee profiles (no frontend artist path reads this table; asp.js only inserts, as admin).
--
-- 2) activity_log (0001): two permissive SELECT policies, "see log via parent event"
--    (`entity_type <> 'event' or …`) and "see log via parent project" (`entity_type <> 'project' or …`).
--    Permissive policies are OR'd, so an event row passed the project policy and vice versa --
--    EVERY row was readable by every signed-in user. Also, since 0026 removed artist SELECT on
--    events, the event branch no longer matched an artist's own events. Replaced by one policy:
--    admins see everything; an artist sees log rows for their own events (via artist_bookings())
--    and their own projects.
--
-- 3) events (0001): 0026 dropped artist SELECT but left "artist updates own events" (all columns,
--    incl. price/commission/status) and "artist deletes own events". Inert only while no SELECT
--    path exists; dangerous if one is re-added. Dropped.
--
-- 4) Security Advisor ERROR "Security Definer View" on artist_booking_view (0026). The view was
--    correct (scoped by `ea.artist_id = current_artist_id()`, safe columns only), but a definer view
--    in the API schema is a footgun: one loosened WHERE leaks every artist's bookings. Same boundary
--    as a SECURITY DEFINER function with a pinned search_path, callable only when signed in:
--    supabase.rpc('artist_bookings'). Nothing in the frontend or Edge Functions read the view.
--
-- 5) Advisor WARN "Function Search Path Mutable": pin search_path on the helper functions.
--
-- 6) Advisor WARN "anon/authenticated can execute SECURITY DEFINER function":
--    - trigger functions (link_new_user_to_roster, rls_auto_enable) run as triggers and need no
--      EXECUTE grant -> revoked from everyone;
--    - is_admin / current_artist_id / current_admin_role: revoked from anon (no signed-out caller
--      needs them). KEPT for authenticated on purpose -- RLS policies call them as the querying
--      user and they only describe the caller themself, so the remaining "authenticated can
--      execute" advisor warnings for these three are accepted.
--
-- Runs as one transaction: if any statement fails (e.g. a name differs on the live DB), nothing changes.

begin;

-- 1) payee profiles: admins only
drop policy if exists "read payee profiles" on payee_profiles;
create policy "admin reads payee profiles" on payee_profiles for select using (is_admin());

-- 4) artist_booking_view -> artist_bookings()
create function public.artist_bookings()
returns table (
  id uuid, booking_type text, title text, type text, date date, "time" text, end_time text,
  venue text, city text, state text, status text, booking_status text, dress_code text,
  flight_needed boolean, flight_booked boolean, flight jsonb,
  ground_transport_needed boolean, ground_transport_booked boolean, ground_transport jsonb,
  artist_paid_out boolean, artist_paid_out_date date, created_at timestamptz,
  artist_id uuid, role text, own_fee numeric, asp_cut numeric, net_amount numeric,
  gross_fee numeric, expenses_charged numeric
)
language sql stable security definer set search_path = public
as $$
  select
    e.id, e.booking_type, e.title, e.type, e.date, e.time, e.end_time,
    e.venue, e.city, e.state, e.status, e.booking_status, e.dress_code,
    e.flight_needed, e.flight_booked, e.flight,
    e.ground_transport_needed, e.ground_transport_booked, e.ground_transport,
    e.artist_paid_out, e.artist_paid_out_date, e.created_at,
    ea.artist_id, ea.role, ea.fee_amount, ea.asp_cut, ea.net_amount,
    ea.gross_fee, ea.expenses_charged
  from events e
  join event_artists ea on ea.event_id = e.id
  where ea.artist_id = current_artist_id();
$$;
revoke execute on function public.artist_bookings() from public, anon;
grant execute on function public.artist_bookings() to authenticated;

drop view if exists public.artist_booking_view;

-- 2) activity_log: one correct SELECT policy
drop policy if exists "see log via parent event" on activity_log;
drop policy if exists "see log via parent project" on activity_log;
drop policy if exists "admin sees all log entries" on activity_log;
create policy "see own or admin log entries" on activity_log for select using (
  is_admin()
  or (entity_type = 'event'   and entity_id in (select b.id from public.artist_bookings() b))
  or (entity_type = 'project' and exists (select 1 from projects p where p.id = entity_id and p.artist_id = current_artist_id()))
);

-- 3) events: drop orphaned artist write policies
drop policy if exists "artist updates own events" on events;
drop policy if exists "artist deletes own events" on events;

-- 5) pin search_path
alter function public.current_artist_id() set search_path = public;
alter function public.is_admin() set search_path = public;
alter function public.current_admin_role() set search_path = public;
alter function public.set_updated_at() set search_path = public;

-- 6) EXECUTE grants
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.current_artist_id() from public, anon;
revoke execute on function public.current_admin_role() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_artist_id() to authenticated;
grant execute on function public.current_admin_role() to authenticated;
revoke execute on function public.link_new_user_to_roster() from public, anon, authenticated;
do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

commit;
