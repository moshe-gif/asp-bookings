-- 0076: the office list can't be used to give yourself more power (security audit 2026-11-02).
-- "admin manages office list" (0006) lets any admin write admin_users, so an admin could, from the browser:
-- change their own role to CEO/COO (which unlocks Mercury money approvals), move a login onto the owner's row
-- (inheriting WhatsApp / library access), or edit/remove the owner. The app's Users card keeps working for
-- ordinary staff; these changes are now refused when made from a browser session:
--   1. a login's link (user_id) -- set only by the sign-up link trigger / server functions;
--   2. your own role or email;
--   3. anything that creates, edits, promotes to, demotes or deletes a CEO/COO row -- unless you are CEO/COO.
-- Server functions (service role) and SQL are not affected.
--
-- Applied: 2026-11-02 (supabase/run-sql.sh)

begin;

create or replace function public.guard_admin_roster() returns trigger
  language plpgsql set search_path = public
  as $$
  declare
    me text := public.current_admin_role();
    top constant text[] := array['admin_ceo', 'admin_coo'];
  begin
    if coalesce(auth.role(), '') not in ('authenticated', 'anon') then
      return coalesce(new, old);
    end if;
    if tg_op = 'UPDATE' then
      if new.user_id is distinct from old.user_id then
        raise exception 'a login is linked to the office list only by signing up';
      end if;
      if old.user_id = auth.uid() and (new.role is distinct from old.role or new.email is distinct from old.email) then
        raise exception 'you can''t change your own role or email';
      end if;
    end if;
    if tg_op = 'INSERT' and new.user_id is not null then
      raise exception 'a login is linked to the office list only by signing up';
    end if;
    if not (coalesce(me, '') = any (top)) and (
         (tg_op in ('UPDATE', 'DELETE') and old.role = any (top))
      or (tg_op in ('INSERT', 'UPDATE') and new.role = any (top))) then
      raise exception 'only the CEO or COO can change a CEO or COO';
    end if;
    return coalesce(new, old);
  end; $$;

drop trigger if exists guard_admin_roster on public.admin_users;
create trigger guard_admin_roster before insert or update or delete on public.admin_users
  for each row execute function public.guard_admin_roster();

commit;
