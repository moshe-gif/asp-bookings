-- 0059: A public image store for what goes out in client emails: the Zelle QR codes (ASP's deposit
-- QR in Settings, each artist's balance QR on their payee profile). Email clients such as Gmail don't
-- show images embedded as data: URIs, so a QR has to be a plain https:// image. Owner 2026-10-14.
-- Applied: 2026-10-14 (supabase/run-sql.sh, verified)
--
-- Anyone can READ (the files are meant for clients' inboxes and hold nothing secret: a Zelle QR
-- shows only the recipient's Zelle name). Only admins can add, replace or remove files. Images only,
-- 2 MB max.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand-public', 'brand-public', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins add brand-public files" on storage.objects;
drop policy if exists "admins change brand-public files" on storage.objects;
drop policy if exists "admins remove brand-public files" on storage.objects;
create policy "admins add brand-public files" on storage.objects for insert to authenticated
  with check (bucket_id = 'brand-public' and is_admin());
create policy "admins change brand-public files" on storage.objects for update to authenticated
  using (bucket_id = 'brand-public' and is_admin()) with check (bucket_id = 'brand-public' and is_admin());
create policy "admins remove brand-public files" on storage.objects for delete to authenticated
  using (bucket_id = 'brand-public' and is_admin());

commit;
