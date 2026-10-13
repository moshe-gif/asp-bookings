-- SING Entertainment is removed from the app (owner 2026-10-13: "remove any sing entertainment stuff";
-- nothing to keep). No contract or document used it (checked: 0 app_records with brand 'sing').
-- The app and the email function fall back to ASP for any unknown brand key.
-- Applied: 2026-10-13 (Management API).

delete from public.brand_config where brand_key = 'sing';
alter table public.brand_config drop constraint if exists brand_config_brand_key_check;
alter table public.brand_config add constraint brand_config_brand_key_check check (brand_key = 'asp');
