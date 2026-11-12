-- 0093: a record IN the database of what schema and code are live (2026-11-12 audit #15.2/#16).
-- Before: migrations were hand-applied with only a "-- Applied:" comment and a README list (missing 34
-- files), and Edge Functions deployed from the local disk with no record of which commit. Now
-- supabase/run-sql.sh writes a schema_migrations row for every migration file it applies, and
-- supabase/deploy-function.sh writes a deployed_functions row (slug + git commit) for every deploy.
-- Service-role / Management API only: no browser can read or write either table.
-- Applied: (run by supabase/run-sql.sh)

create table if not exists public.schema_migrations (
  version     text primary key,                 -- the file name without .sql, e.g. 0093_migration_and_deploy_ledger
  applied_at  timestamptz not null default now(),
  git_sha     text,                             -- commit the file was applied from (null = backfilled)
  note        text
);
create table if not exists public.deployed_functions (
  id          bigint generated always as identity primary key,
  slug        text not null,
  git_sha     text not null,
  version     int,                              -- Supabase's own version number for the function
  deployed_at timestamptz not null default now()
);
create index if not exists deployed_functions_slug on public.deployed_functions (slug, deployed_at desc);

alter table public.schema_migrations  enable row level security;
alter table public.deployed_functions enable row level security;
revoke all on public.schema_migrations, public.deployed_functions from anon, authenticated;

-- Backfill (checked 2026-11-12 against the live schema: every file through 0092 is applied except 0086,
-- the Face ID enforcement, which is deliberately not applied yet; 0038_test_artist_isolation is a
-- rollback-only check script, not a migration).
insert into public.schema_migrations (version, applied_at, note)
select v, now(), 'backfilled 2026-11-12 (pre-ledger)'
from unnest(array[
  '0001_initial_schema','0002_auth_linking','0003_roles_and_documents','0004_companies',
  '0005_artist_admin_company_scoping','0006_revert_company_scoping','0007_sync_support',
  '0008_wedding_band_fields','0009_quickbooks_connection','0010_contract_builder_tables',
  '0011_external_events_and_reminders','0012_event_artists_and_payments','0013_integrations_and_calendar',
  '0014_travel_and_flight','0015_zelle_gmail_and_brand','0016_legacy_id_references','0017_gcal_connection',
  '0018_payments_unmatched_status','0019_gmail_oauth_tokens','0020_booking_record',
  '0021_multi_artist_and_approval','0022_payment_verification_fields','0023_logistics_gate',
  '0024_expenses_and_settlement','0025_booking_field_history','0026_fix_artist_rls_leaks',
  '0028_grant_authenticated_table_access','0029_artists_legacy_id','0030_admin_coo_role',
  '0031_rls_and_security_advisor_fixes','0032_shared_events_app_doc','0033_payments_dedupe_constraint',
  '0034_oauth_states','0035_app_records_shared_collections','0036_app_records_settings',
  '0037_artists_roster_owner','0038_artist_portal_views','0039_artist_finance_view_nulls',
  '0040_email_sends_and_brand_email','0041_gmail_tables_service_role','0042_artist_commission_pct',
  '0043_artist_finance_package_scope','0044_office_email_everywhere','0045_email_sends_service_role',
  '0046_service_role_table_access','0047_artist_gig_view_office_days','0048_qbo_connection',
  '0049_tighten_client_grants','0050_artist_directory','0051_artists_own_row_only',
  '0052_contract_sign_requests','0053_drop_artist_bookings_rpc','0054_rls_auth_uid_once',
  '0055_remove_sing_brand','0056_payment_requests','0057_payment_claims','0058_client_followups',
  '0059_brand_public_storage','0060_artist_itinerary_view','0062_inbox_items','0063_stripe_payees',
  '0064_money_in','0066_artist_collect_at_event','0067_mercury_split','0068_video_library',
  '0069_crew_and_private_library','0070_crew_hardening','0071_whatsapp_inbox','0072_deposit_confirmations',
  '0073_whatsapp_media_contacts','0074_library_drive_backup','0075_removable_logins',
  '0076_admin_roster_guard','0077_office_list_private','0078_monthly_payouts','0079_monthly_payouts_safety',
  '0080_whatsapp_notices','0081_gig_info_forms','0082_office_payouts_reminder','0083_gig_form_reminders',
  '0084_singer_gig_sheet_and_more','0085_riders','0087_singer_week_cash_report','0088_calendar_feeds',
  '0089_singer_notify_prefs','0090_travel_login_and_delete_rights','0091_artist_bio',
  '0092_payment_zelle_reported'
]) as v
on conflict (version) do nothing;
