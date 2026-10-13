-- artist_bookings() (0031) was callable by any signed-in artist over /rest/v1/rpc and returned
-- every event they were attached to at ANY status (leads included, against the 2026-10-12 owner
-- rule "artists should not see leads") with fee columns, bypassing artist_gig_view's scope.
-- Nothing in the app calls it; only activity_log's read policy did. That policy now uses
-- artist_gig_view (the one definition of "gigs this artist may see"), and the function is dropped.
-- Applied: 2026-10-13 (Management API).

drop policy if exists "see own or admin log entries" on public.activity_log;
create policy "see own or admin log entries" on public.activity_log for select using (
  is_admin()
  or (entity_type = 'event' and entity_id in (select g.event_id from public.artist_gig_view g))
  or (entity_type = 'project' and exists (select 1 from public.projects p
                                          where p.id = activity_log.entity_id and p.artist_id = current_artist_id()))
);

drop function if exists public.artist_bookings();
