-- 0035: Shared office records — contracts, payee profiles, projects, invoices, external events,
-- documents, travel requests (Wave 4 of the 2026-10-09 audit: "all business data lives in each
-- browser"). Applied: 2026-10-11 (Supabase Management API, verified)
--
-- Same model as gigs in 0032: each record is stored whole as the app already uses it (app_doc),
-- keyed by its app id (legacy_id, e.g. "CT-12") within its collection. The app's shared-sync
-- engine (frontend/workspaces/asp.js, "SHARED RECORDS") loads these for signed-in admins, writes
-- every save through, and Realtime pushes other admins' changes live. localStorage is a cache.
--
-- One generic table rather than reusing the older relational contracts/payee_profiles tables:
-- those were one-way, partial migration snapshots (null FKs, missing fields) that nothing reads;
-- their NOT NULL/check constraints don't fit whole-record storage. They are legacy from here on.
--
-- Admin-only (payee profiles hold bank/wire details). Primary key is (collection, legacy_id), so a
-- Realtime DELETE notice -- which carries only the key under RLS -- still says which record went.

begin;

create table if not exists app_records (
  collection text not null check (collection in
    ('contracts','payee_profiles','projects','invoices','outside_bookings','documents','travel_requests')),
  legacy_id text not null,
  app_doc jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (collection, legacy_id)
);
alter table app_records enable row level security;
create policy "admins manage shared records" on app_records for all using (is_admin()) with check (is_admin());
revoke all on app_records from anon;
grant select, insert, update, delete on app_records to authenticated;

drop trigger if exists app_records_set_updated_at on app_records;
create trigger app_records_set_updated_at before update on app_records
  for each row execute function public.set_updated_at();

alter table app_records replica identity full;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_records') then
    alter publication supabase_realtime add table app_records;
  end if;
end $$;

commit;
