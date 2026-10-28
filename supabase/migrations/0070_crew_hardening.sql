-- 0070: Tightening 0069 after review (2026-10-28).
-- 1. Library access can't be self-granted: any admin may edit admin_users rows (0006), so a trigger
--    keeps library_access unchanged except from the database owner / service role (set by SQL).
-- 2. Only library admins (the owner, Ilan) add or change crew -- otherwise another admin could add
--    themselves as crew and get the library that way.
-- 3. Crew read each other only through crew_directory (id, name, initials, kind, active): no emails or
--    phone numbers. Their own row stays readable (sign-in).
-- Applied: 2026-10-28 (supabase/run-sql.sh)

begin;

create or replace function public.guard_library_access() returns trigger
  language plpgsql set search_path = public
  as $$ begin
    if coalesce(auth.role(), '') in ('authenticated', 'anon')
       and (tg_op = 'INSERT' and new.library_access or tg_op = 'UPDATE' and new.library_access is distinct from old.library_access) then
      raise exception 'library access is set by the owner';
    end if;
    return new;
  end; $$;
drop trigger if exists guard_library_access on public.admin_users;
create trigger guard_library_access before insert or update on public.admin_users
  for each row execute function public.guard_library_access();

create or replace function public.is_library_admin() returns boolean
  language sql stable security definer set search_path = public
  as $$ select exists(select 1 from admin_users where user_id = auth.uid() and library_access) $$;
revoke execute on function public.is_library_admin() from public, anon;
grant execute on function public.is_library_admin() to authenticated;

drop policy if exists "admins and crew read crew" on public.crew_members;
drop policy if exists "admins manage crew" on public.crew_members;
drop policy if exists "admins read crew, crew their own row" on public.crew_members;
drop policy if exists "library admins manage crew" on public.crew_members;
create policy "admins read crew, crew their own row" on public.crew_members for select to authenticated
  using ((select is_admin()) or user_id = (select auth.uid()));
create policy "library admins manage crew" on public.crew_members for all to authenticated
  using ((select is_library_admin())) with check ((select is_library_admin()));

create or replace view public.crew_directory with (security_barrier = true) as
  select id, name, initials, kind, active from public.crew_members
   where (select is_admin()) or (select current_crew_id()) is not null;
revoke all on public.crew_directory from anon, authenticated;
grant select on public.crew_directory to authenticated, service_role;

commit;
