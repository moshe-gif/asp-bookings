-- 0037: Supabase `artists` is the one owner of the artist roster (audit 3.6). The app used to have
-- four: a seed list in asp.js, each browser's localStorage copy, this table, and a hardcoded
-- slot/role override that undid edits. From here every signed-in session loads this table and it
-- wins; artists added in the app are inserted here.
-- Applied: 2026-10-11 (Supabase Management API, verified)
--
-- An artist on the roster may not have a login or a known email yet (email was invented before
-- audit 2.5), so email becomes optional; it stays unique when present. Shmili Landau, on the
-- roster but never given a row, is added once (no email -- add his login under Settings → Users).

begin;
alter table artists alter column email drop not null;
insert into artists (legacy_id, name, slot, initials, role, email)
select 'shmili', 'Shmili Landau', 5, 'SL', 'DJ', null
where not exists (select 1 from artists where legacy_id = 'shmili');
commit;
