-- 0069: Crew accounts (social media) and a private video library (owner 2026-10-28: "this should not
-- be a public page it should be as part of the app only visible to ilan tzvi and myself. tzvi manages
-- social media he needs an account also lilker needs an account ... lilker should only see the ones
-- assigned to him ... tzvi should be able to see the main calendar and all gigs, but no financials
-- what so ever, he should have access to assign lilker but not to create or cancel gigs").
--
-- 1. crew_members: people who are neither office staff nor performers. kind 'social' (Tzvi: every gig,
--    assigns the videographer) or 'videographer' (Lilker: only the gigs he is asked to film). They are
--    not in admin_users, so is_admin() stays false and every office table (money included) stays closed
--    to them by the existing RLS. Linked to their sign-in by email, like staff and artists.
-- 2. gig_crew: who is asked to film which gig, and whether they confirmed. Written only by the `crew`
--    Edge Function (it checks who may assign / respond and sends the WhatsApp).
-- 3. crew_gig_view: the only way crew read gigs -- date, time, venue, singers, dress code, gig sheet.
--    No price, fee, deposit, balance, commission or payment column, and no "paid" status.
-- 4. The video library is no longer public: only admins given library_access (the owner and Ilan) and
--    crew can watch it; the same admins and social crew manage it. The storage bucket becomes private
--    (files are reached through short-lived signed links).
--
-- People (who is crew, who has library access) are set with SQL outside the repo: their emails are
-- personal data and the repo is public.
--
-- Applied: 2026-10-28 (supabase/run-sql.sh; crew rows and library access set separately, outside the repo)

begin;

create table if not exists public.crew_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null check (length(name) between 1 and 120),
  initials text,
  email text not null unique check (email = lower(email)),
  phone text,
  kind text not null check (kind in ('social', 'videographer')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.gig_crew (
  event_id uuid not null references public.events(id) on delete cascade,
  crew_id uuid not null references public.crew_members(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'declined')),
  requested_by uuid,
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  notify_result text,
  primary key (event_id, crew_id)
);
create index if not exists gig_crew_crew on public.gig_crew (crew_id);

alter table public.admin_users add column if not exists library_access boolean not null default false;

-- Who is signed in, as crew.
create or replace function public.current_crew_id() returns uuid
  language sql stable security definer set search_path = public
  as $$ select id from crew_members where user_id = auth.uid() and active $$;
create or replace function public.current_crew_kind() returns text
  language sql stable security definer set search_path = public
  as $$ select kind from crew_members where user_id = auth.uid() and active $$;
create or replace function public.can_view_library() returns boolean
  language sql stable security definer set search_path = public
  as $$ select exists(select 1 from admin_users where user_id = auth.uid() and library_access)
            or exists(select 1 from crew_members where user_id = auth.uid() and active) $$;
create or replace function public.can_manage_library() returns boolean
  language sql stable security definer set search_path = public
  as $$ select exists(select 1 from admin_users where user_id = auth.uid() and library_access)
            or exists(select 1 from crew_members where user_id = auth.uid() and active and kind = 'social') $$;
revoke execute on function public.current_crew_id(), public.current_crew_kind(), public.can_view_library(), public.can_manage_library() from public, anon;
grant execute on function public.current_crew_id(), public.current_crew_kind(), public.can_view_library(), public.can_manage_library() to authenticated;

-- New sign-ins link to crew rows too (same as staff and artists).
create or replace function public.link_new_user_to_roster() returns trigger
  language plpgsql security definer set search_path = public
  as $$ begin
    update admin_users set user_id = new.id where email = new.email and user_id is null;
    update artists set user_id = new.id where email = new.email and user_id is null;
    update crew_members set user_id = new.id where email = lower(new.email) and user_id is null;
    return new;
  end; $$;
revoke execute on function public.link_new_user_to_roster() from public, anon, authenticated;

-- A crew row added after the person's sign-in account already exists: the app links it at sign-in
-- (by the account's own verified email; never someone else's row).
create or replace function public.claim_crew_account() returns uuid
  language sql volatile security definer set search_path = public
  as $$ update crew_members set user_id = auth.uid()
         where user_id is null and email = lower(coalesce(auth.jwt() ->> 'email', '')) and auth.uid() is not null
           and not exists (select 1 from crew_members where user_id = auth.uid())
       returning id $$;
revoke execute on function public.claim_crew_account() from public, anon;
grant execute on function public.claim_crew_account() to authenticated;

alter table public.crew_members enable row level security;
alter table public.gig_crew enable row level security;

drop policy if exists "admins and crew read crew" on public.crew_members;
drop policy if exists "admins manage crew" on public.crew_members;
create policy "admins and crew read crew" on public.crew_members for select to authenticated
  using ((select is_admin()) or (select current_crew_id()) is not null);
create policy "admins manage crew" on public.crew_members for all to authenticated
  using ((select is_admin())) with check ((select is_admin()));

drop policy if exists "who sees gig crew" on public.gig_crew;
create policy "who sees gig crew" on public.gig_crew for select to authenticated
  using ((select is_admin()) or (select current_crew_kind()) = 'social' or crew_id = (select current_crew_id()));

revoke all on public.crew_members, public.gig_crew from anon, authenticated;
grant select on public.crew_members, public.gig_crew to authenticated;
grant insert, update, delete on public.crew_members to authenticated;
grant all on public.crew_members, public.gig_crew to service_role;

-- Gigs as crew see them. Social: every gig that is booked or waiting on its contract (no leads, no
-- internal days). Videographer: the gigs he is asked to film and hasn't turned down.
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
       (select gc.status from gig_crew gc where gc.event_id = e.id and gc.crew_id = me.crew_id) as my_status
  from events e, me
 where me.crew_id is not null
   and coalesce(e.unpaid, false) = false
   and e.status in ('contract_sent', 'booked', 'paid')
   and (me.kind = 'social'
        or exists (select 1 from gig_crew gc where gc.event_id = e.id and gc.crew_id = me.crew_id and gc.status <> 'declined'));

revoke all on public.crew_gig_view from anon, authenticated;
grant select on public.crew_gig_view to authenticated;
grant select on public.crew_gig_view to service_role;

-- Crew see singers' names and colours on the calendar (the name-only directory artists already read).
grant select on public.artist_directory to authenticated;

-- The library: signed-in people with access only.
drop policy if exists "anyone reads live singers" on public.library_singers;
drop policy if exists "admins manage singers" on public.library_singers;
drop policy if exists "anyone reads tags" on public.library_tags;
drop policy if exists "admins manage tags" on public.library_tags;
drop policy if exists "anyone reads published videos" on public.library_videos;
drop policy if exists "admins manage videos" on public.library_videos;
drop policy if exists "anyone reads video tags" on public.library_video_tags;
drop policy if exists "admins manage video tags" on public.library_video_tags;
drop policy if exists "viewers read singers" on public.library_singers;
drop policy if exists "managers manage singers" on public.library_singers;
drop policy if exists "viewers read tags" on public.library_tags;
drop policy if exists "managers manage tags" on public.library_tags;
drop policy if exists "viewers read videos" on public.library_videos;
drop policy if exists "managers manage videos" on public.library_videos;
drop policy if exists "viewers read video tags" on public.library_video_tags;
drop policy if exists "managers manage video tags" on public.library_video_tags;

create policy "viewers read singers" on public.library_singers for select to authenticated
  using ((select can_view_library()) and (active or (select can_manage_library())));
create policy "managers manage singers" on public.library_singers for all to authenticated
  using ((select can_manage_library())) with check ((select can_manage_library()));
create policy "viewers read tags" on public.library_tags for select to authenticated
  using ((select can_view_library()));
create policy "managers manage tags" on public.library_tags for all to authenticated
  using ((select can_manage_library())) with check ((select can_manage_library()));
create policy "viewers read videos" on public.library_videos for select to authenticated
  using ((select can_view_library()) and ((select can_manage_library())
    or (published and exists (select 1 from public.library_singers s where s.id = singer_id and s.active))));
create policy "managers manage videos" on public.library_videos for all to authenticated
  using ((select can_manage_library())) with check ((select can_manage_library()));
create policy "viewers read video tags" on public.library_video_tags for select to authenticated
  using ((select can_view_library()));
create policy "managers manage video tags" on public.library_video_tags for all to authenticated
  using ((select can_manage_library())) with check ((select can_manage_library()));

revoke all on public.library_singers, public.library_tags, public.library_videos, public.library_video_tags from anon, authenticated;
grant select, insert, update, delete on public.library_singers, public.library_tags, public.library_videos, public.library_video_tags to authenticated;

update storage.buckets set public = false where id = 'library';

drop policy if exists "admins read library files" on storage.objects;
drop policy if exists "admins add library files" on storage.objects;
drop policy if exists "admins change library files" on storage.objects;
drop policy if exists "admins remove library files" on storage.objects;
drop policy if exists "viewers read library files" on storage.objects;
drop policy if exists "managers add library files" on storage.objects;
drop policy if exists "managers change library files" on storage.objects;
drop policy if exists "managers remove library files" on storage.objects;
create policy "viewers read library files" on storage.objects for select to authenticated
  using (bucket_id = 'library' and can_view_library());
create policy "managers add library files" on storage.objects for insert to authenticated
  with check (bucket_id = 'library' and can_manage_library());
create policy "managers change library files" on storage.objects for update to authenticated
  using (bucket_id = 'library' and can_manage_library()) with check (bucket_id = 'library' and can_manage_library());
create policy "managers remove library files" on storage.objects for delete to authenticated
  using (bucket_id = 'library' and can_manage_library());

commit;
