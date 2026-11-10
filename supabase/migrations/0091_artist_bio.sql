-- One singer profile (owner 2026-11-09: "ONE singer profile (contact, Zelle, commission, rider, bio, photo) used by
-- app, contracts and website"). The bio is the only piece that had no home yet. Admins already manage the artists
-- table (0001 "admin manages roster"); artists read only their own row (0051), so the bio needs no new policy.
-- Applied: 2026-11-10 (supabase/run-sql.sh)

alter table public.artists add column if not exists bio text;
alter table public.artists drop constraint if exists artists_bio_len;
alter table public.artists add constraint artists_bio_len check (bio is null or length(bio) <= 4000);
