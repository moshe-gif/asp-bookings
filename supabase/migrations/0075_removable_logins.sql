-- 0075: Removing a person's login works (owner 2026-10-29: "why cant i delete these test accounts" --
-- Settings -> Users -> Remove said "Database error deleting user").
-- Fifteen tables pointed at auth.users with the default ON DELETE NO ACTION, so Supabase refused to delete
-- any login that had ever recorded a payment, sent an email, connected an account and so on. Now:
--   user_settings (the person's own preferences)  -> deleted with the login (CASCADE)
--   every other "who did it" / roster link        -> kept, the person blanked (SET NULL)
-- History stays; only the link to the deleted login goes.
--
-- Applied: 2026-10-29 (supabase/run-sql.sh)

begin;
do $$
declare r record;
begin
  for r in
    select c.conname, c.conrelid::regclass as tbl, a.attname as col
    from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f' and c.confrelid = 'auth.users'::regclass
      and c.conrelid::regclass::text not like 'auth.%' and c.confdeltype not in ('c', 'n')
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
    execute format('alter table %s add constraint %I foreign key (%I) references auth.users(id) on delete %s',
      r.tbl, r.conname, r.col, case when r.tbl::text = 'user_settings' then 'cascade' else 'set null' end);
  end loop;
end $$;
commit;
