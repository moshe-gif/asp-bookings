-- 0074: Video Library backup to Google Drive (owner 2026-10-29: "can we connect the video library to backup
-- all footage in google drive backup?" -- the account: office@aspmgmt.com).
-- Every library video is copied, original file, into "ASP Video Library / <singer>" on that Drive by the
-- library-drive-backup Edge Function (a schedule every 10 minutes, in pieces, so big files survive). Deleting a
-- video in the app never deletes the Drive copy: it is a backup.
--
-- 1. oauth_states may carry 'gdrive' (the connect flow reuses the Gmail OAuth client and its callback).
-- 2. drive_backup: the one Drive connection (tokens) and the run lock. Service role only.
-- 3. library_drive_folders / library_drive_files: which Drive folder holds each singer and how far each video
--    has got (the resumable upload link is a credential, so these are service role only too).
--
-- Applied: 2026-10-29 (supabase/run-sql.sh)

begin;

alter table public.oauth_states drop constraint if exists oauth_states_provider_check;
alter table public.oauth_states add constraint oauth_states_provider_check check (provider in ('qbo','gcal','gmail','gdrive'));

create table if not exists public.drive_backup (
  id int primary key default 1 check (id = 1),
  account_email text not null default 'office@aspmgmt.com',
  refresh_token text,
  access_token text,
  access_token_expires_at timestamptz,
  root_folder_id text,
  connected_at timestamptz,
  running_until timestamptz,
  last_run_at timestamptz,
  last_error text
);
insert into public.drive_backup (id) values (1) on conflict (id) do nothing;

create table if not exists public.library_drive_folders (
  singer_id uuid primary key references public.library_singers(id) on delete cascade,
  folder_id text not null
);

-- No foreign key to library_videos: a video deleted in the app keeps its row (and its Drive copy).
create table if not exists public.library_drive_files (
  video_id uuid primary key,
  drive_file_id text,
  upload_url text,
  uploaded_bytes bigint not null default 0,
  total_bytes bigint,
  backed_up_at timestamptz,
  attempts int not null default 0,
  error text,
  updated_at timestamptz not null default now()
);

alter table public.drive_backup enable row level security;
alter table public.library_drive_folders enable row level security;
alter table public.library_drive_files enable row level security;
revoke all on public.drive_backup, public.library_drive_folders, public.library_drive_files from anon, authenticated;
grant all on public.drive_backup, public.library_drive_folders, public.library_drive_files to service_role;

commit;
