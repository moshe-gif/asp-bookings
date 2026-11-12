-- 0094: two more ways the office list could be used to gain power, closed (2026-11-12 audit #11).
--   1. Money roles. 0076 protected only CEO/COO rows, but bookkeeping can send Mercury payouts, so any admin
--      could add a second login of their own as "bookkeeping". Now only the CEO or COO can create, promote to,
--      demote or delete a CEO, COO or bookkeeping row. (A bookkeeper can still edit their own name; nobody can
--      change their own role or email -- 0076.)
--   2. Singer logins. Any admin could point an artist row at another person's login (e.g. the owner's) and then
--      "Remove" that artist, which deleted the owner's login. A browser session may no longer set or change
--      artists.user_id -- it is linked only by the sign-up trigger or server functions, as on admin_users.
--      (admin-remove-user also refuses to delete a login that belongs to an office admin.)
-- Server functions (service role) and SQL are not affected. Applied: (run by supabase/run-sql.sh)

begin;

create or replace function public.guard_admin_roster() returns trigger
  language plpgsql set search_path = public
  as $$
  declare
    me text := public.current_admin_role();
    top constant text[] := array['admin_ceo', 'admin_coo'];
    powerful constant text[] := array['admin_ceo', 'admin_coo', 'admin_bookkeeping'];   -- can move money
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
         (tg_op in ('UPDATE', 'DELETE') and old.role = any (powerful) and old.user_id is distinct from auth.uid())
      or (tg_op = 'DELETE' and old.role = any (powerful))
      or (tg_op in ('INSERT', 'UPDATE') and new.role = any (powerful) and new.role is distinct from (case when tg_op = 'UPDATE' then old.role end))) then
      raise exception 'only the CEO or COO can add, change or remove a CEO, COO or bookkeeping login';
    end if;
    return coalesce(new, old);
  end; $$;

create or replace function public.guard_artist_login() returns trigger
  language plpgsql set search_path = public
  as $$
  begin
    if coalesce(auth.role(), '') not in ('authenticated', 'anon') then
      return new;
    end if;
    if (tg_op = 'INSERT' and new.user_id is not null)
       or (tg_op = 'UPDATE' and new.user_id is distinct from old.user_id) then
      raise exception 'a login is linked to a singer only by signing up';
    end if;
    return new;
  end; $$;

drop trigger if exists guard_artist_login on public.artists;
create trigger guard_artist_login before insert or update on public.artists
  for each row execute function public.guard_artist_login();

commit;
