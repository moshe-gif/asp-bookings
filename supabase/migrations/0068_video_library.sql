-- 0068: The video library (owner 2026-10-28: "a searchable video library for a music agency's singers.
-- Think Splice, but for performance videos"). Clients and bookers open app.aspmgmt.com/videos/ (no
-- login), pick a singer and filter that singer's performance videos by Event, Tempo and Crowd; each
-- video plays in the page and downloads as the original file. The office manages it in the app
-- (Videos): singers, bulk upload, a fast tagging table, and the tag lists themselves.
--
-- 1. library_singers: who appears on the home page (their own list, not the roster: a library singer
--    needs no login, and the roster's emails stay private). artist_id optionally links a roster artist.
-- 2. library_tags: the options of each filter (event / tempo / lifestyle), editable in the app.
-- 3. library_videos: one per uploaded file, under one singer (deleting a singer deletes their videos).
-- 4. library_video_tags: a video's tags (any number; the tagging table sets one per filter).
-- 5. Storage bucket 'library' (public; up to 5 GB a file): videos/<singer>/<id>.<ext>,
--    thumbs/<id>.jpg (made in the browser at upload), singers/<id>.<ext> (photos).
--
-- Anyone can read live singers, published videos and the tags (the page is public by design: these
-- are performance videos for clients). Only admins add, change or remove anything.
--
-- Applied: 2026-10-28 (supabase/run-sql.sh, verified: 12 tags, the 5 roster singers, bucket 5 GB)

begin;

create table if not exists public.library_singers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,60}$'),
  name text not null check (length(name) between 1 and 120),
  photo_path text,
  sort int not null default 0,
  active boolean not null default true,
  artist_id uuid references public.artists(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.library_tags (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('event', 'tempo', 'lifestyle')),
  name text not null check (length(name) between 1 and 60),
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists library_tags_unique on public.library_tags (category, lower(name));

create table if not exists public.library_videos (
  id uuid primary key default gen_random_uuid(),
  singer_id uuid not null references public.library_singers(id) on delete cascade,
  title text not null check (length(title) between 1 and 200),
  songs text,
  recorded_on date,
  duration_s numeric,
  video_path text not null,
  thumb_path text,
  file_name text,
  size_bytes bigint,
  mime text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists library_videos_singer on public.library_videos (singer_id, created_at desc);

create table if not exists public.library_video_tags (
  video_id uuid not null references public.library_videos(id) on delete cascade,
  tag_id uuid not null references public.library_tags(id) on delete cascade,
  primary key (video_id, tag_id)
);
create index if not exists library_video_tags_tag on public.library_video_tags (tag_id);

alter table public.library_singers enable row level security;
alter table public.library_tags enable row level security;
alter table public.library_videos enable row level security;
alter table public.library_video_tags enable row level security;

drop policy if exists "anyone reads live singers" on public.library_singers;
drop policy if exists "admins manage singers" on public.library_singers;
-- (anon can't run is_admin(): the public read policies don't call it; admins read the rest through
-- their own "manage" policy.)
create policy "anyone reads live singers" on public.library_singers for select using (active);
create policy "admins manage singers" on public.library_singers for all to authenticated using ((select is_admin())) with check ((select is_admin()));

drop policy if exists "anyone reads tags" on public.library_tags;
drop policy if exists "admins manage tags" on public.library_tags;
create policy "anyone reads tags" on public.library_tags for select using (true);
create policy "admins manage tags" on public.library_tags for all to authenticated using ((select is_admin())) with check ((select is_admin()));

drop policy if exists "anyone reads published videos" on public.library_videos;
drop policy if exists "admins manage videos" on public.library_videos;
create policy "anyone reads published videos" on public.library_videos for select
  using (published and exists (select 1 from public.library_singers s where s.id = singer_id and s.active));
create policy "admins manage videos" on public.library_videos for all to authenticated using ((select is_admin())) with check ((select is_admin()));

drop policy if exists "anyone reads video tags" on public.library_video_tags;
drop policy if exists "admins manage video tags" on public.library_video_tags;
create policy "anyone reads video tags" on public.library_video_tags for select using (true);
create policy "admins manage video tags" on public.library_video_tags for all to authenticated using ((select is_admin())) with check ((select is_admin()));

revoke all on public.library_singers, public.library_tags, public.library_videos, public.library_video_tags from anon, authenticated;
grant select on public.library_singers, public.library_tags, public.library_videos, public.library_video_tags to anon, authenticated;
grant insert, update, delete on public.library_singers, public.library_tags, public.library_videos, public.library_video_tags to authenticated;
grant all on public.library_singers, public.library_tags, public.library_videos, public.library_video_tags to service_role;

-- The filter options the owner asked for; more can be added in the app.
insert into public.library_tags (category, name, sort) values
  ('event', 'Wedding', 1), ('event', 'Bar Mitzvah', 2), ('event', 'Concert', 3), ('event', 'Kumzitz', 4), ('event', 'Corporate', 5), ('event', 'Other', 6),
  ('tempo', 'Fast', 1), ('tempo', 'Mid', 2), ('tempo', 'Slow', 3),
  ('lifestyle', 'Chassidish', 1), ('lifestyle', 'Litvish', 2), ('lifestyle', 'Heimish', 3)
on conflict do nothing;

-- The roster's singers to start with (no photos yet; remove or add any in the app).
insert into public.library_singers (slug, name, sort, artist_id)
select trim(both '-' from regexp_replace(lower(a.name), '[^a-z0-9]+', '-', 'g')), a.name, a.slot, a.id
from public.artists a where a.role = 'Singer'
on conflict (slug) do nothing;

-- Storage: public reads by URL; admins upload (resumable uploads also need to read and replace).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('library', 'library', true, 5368709120, array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v', 'video/x-msvideo', 'video/mpeg', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins read library files" on storage.objects;
drop policy if exists "admins add library files" on storage.objects;
drop policy if exists "admins change library files" on storage.objects;
drop policy if exists "admins remove library files" on storage.objects;
create policy "admins read library files" on storage.objects for select to authenticated
  using (bucket_id = 'library' and is_admin());
create policy "admins add library files" on storage.objects for insert to authenticated
  with check (bucket_id = 'library' and is_admin());
create policy "admins change library files" on storage.objects for update to authenticated
  using (bucket_id = 'library' and is_admin()) with check (bucket_id = 'library' and is_admin());
create policy "admins remove library files" on storage.objects for delete to authenticated
  using (bucket_id = 'library' and is_admin());

commit;
