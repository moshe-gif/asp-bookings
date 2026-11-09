-- 0085: Singers' riders (owner 2026-11-09: "you should have a rider for each singer especially dj shmili that gets
-- sent to client on request"). One PDF per singer, uploaded in Settings → Riders; "Send rider" on a gig emails the
-- client a link to it. The link has to work from a client's inbox, so the store is public-read like brand-public
-- (0059): a rider holds stage / sound / hospitality needs, nothing secret, and its file name is unguessable.
-- Only admins add, replace or remove files. PDF only, 15 MB max. Which file belongs to which singer is in office
-- settings (app_records settings/org value.riders), not here.
-- Applied: 2026-11-09 (supabase/run-sql.sh, verified)

begin;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('riders', 'riders', true, 15728640, array['application/pdf'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins add riders" on storage.objects;
drop policy if exists "admins change riders" on storage.objects;
drop policy if exists "admins remove riders" on storage.objects;
create policy "admins add riders" on storage.objects for insert to authenticated
  with check (bucket_id = 'riders' and is_admin());
create policy "admins change riders" on storage.objects for update to authenticated
  using (bucket_id = 'riders' and is_admin()) with check (bucket_id = 'riders' and is_admin());
create policy "admins remove riders" on storage.objects for delete to authenticated
  using (bucket_id = 'riders' and is_admin());
commit;
