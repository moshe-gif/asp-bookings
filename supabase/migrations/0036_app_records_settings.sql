-- 0036: Office-wide settings (pricing + org settings such as the travel booker's email) shared
-- through app_records like every other record (audit 3.12). They were per-browser, so each
-- office computer could quote different rates and send travel requests to a different address.
-- Applied: 2026-10-11 (Supabase Management API, verified)
--
-- One row per settings document in collection 'settings' (legacy_id 'org' / 'pricing'). Personal
-- preferences (notification toggles etc.) stay per-browser on purpose.

begin;
alter table app_records drop constraint if exists app_records_collection_check;
alter table app_records add constraint app_records_collection_check check (collection in
  ('contracts','payee_profiles','projects','invoices','outside_bookings','documents','travel_requests','settings'));
commit;
