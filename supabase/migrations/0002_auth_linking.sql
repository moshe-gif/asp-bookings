-- Links a newly-created auth.users row to an existing artists/admin_users row by
-- matching email, so RLS's is_admin()/current_artist_id() helpers work once someone
-- actually signs in. Office adds the person's row (with their real email) first;
-- when that person later authenticates for the first time, this trigger sets
-- user_id on the matching row. Only ever links a row that isn't already linked
-- (user_id is null), so it can never hijack someone else's account.
-- Infrastructure only -- inserts zero rows itself.

create or replace function link_new_user_to_roster()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update admin_users set user_id = new.id where email = new.email and user_id is null;
  update artists set user_id = new.id where email = new.email and user_id is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function link_new_user_to_roster();
