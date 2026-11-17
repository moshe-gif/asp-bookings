-- 0102: the server side of "Face ID on every login" (owner 2026-11-09: "i want the login to be super secure, faceid
-- on every login"; 2026-11-12: "i need it to be able to login with verified emails also"; 2026-11-17: "go").
-- The app asks for Face ID (a passkey) or an emailed code every time it opens; until now that was only the app's own
-- screen, so a stolen or long-lived session token still read everything. Now every check that RLS policies and the
-- server functions use -- office, roles, singer, crew, WhatsApp, video library -- also needs strong_auth(): this
-- session was signed in with a passkey or an emailed code within the last 24 hours. A session kept alive only by
-- refreshing its token longer than that reads nothing until the person signs in again (the app asks again at 23
-- hours, so an open screen never hits the cutoff). Live check 2026-11-17: every real session is a passkey or
-- emailed-code sign-in.
-- A passkey only counts if it was added to the account right after a real sign-in: a stolen (or day-old) session
-- could otherwise register its own passkey and sign in with it. passkey_approvals lists the passkeys added within
-- 10 minutes after a passkey or emailed-code sign-in of the same person (existing ones approved here); while the
-- account has any passkey that isn't, Face ID sign-ins don't count for it -- an emailed code still does -- until
-- the office looks (delete the stray passkey in Supabase Auth). Supabase owns the passkey table, so this is checked
-- on read (and recorded every minute, so it doesn't depend on old sign-in records being kept).
-- The test harness's accounts (test-*@aspmgmt.com, password sign-in) are the one exception, as in the app. Some of
-- them hold office roles (CEO, bookkeeping, WhatsApp, library) for the tests, so their passwords must stay strong
-- and private; replacing the email pattern with an explicit flag is on the CLAUDE.md phase-out list.
-- A person's own roster row (admin_users / artists / crew_members "own row" policies) stays readable: the app
-- needs it to show the right sign-in screen, and it holds nothing beyond their own name and role.
-- Bodies are the live definitions of 2026-11-17 plus the strong_auth() test. Applied: (run by supabase/run-sql.sh)

begin;

create table if not exists public.passkey_approvals (
  credential_id uuid primary key,          -- auth.webauthn_credentials.id
  user_id uuid not null,
  approved_at timestamptz not null default now(),
  how text not null
);
alter table public.passkey_approvals enable row level security;
revoke all on public.passkey_approvals from anon, authenticated;

-- The passkeys there before this rule (the owner's, 2026-10-11 and 10-12).
insert into public.passkey_approvals (credential_id, user_id, how)
  select id, user_id, 'existing before 0102' from auth.webauthn_credentials on conflict do nothing;

-- A passkey added within 10 minutes after a passkey or emailed-code sign-in of the same person (never one made
-- with a sign-in that came after it -- that would be the new passkey itself).
create or replace function public.passkey_ok(p_cred uuid, p_user uuid, p_created timestamptz)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists(select 1 from public.passkey_approvals a where a.credential_id = p_cred)
      or exists(select 1 from auth.mfa_amr_claims c join auth.sessions s on s.id = c.session_id
                 where s.user_id = p_user and c.authentication_method in ('passkey', 'otp', 'magiclink')
                   and c.updated_at <= p_created and c.updated_at > p_created - interval '10 minutes');
$$;
revoke all on function public.passkey_ok(uuid, uuid, timestamptz) from public, anon, authenticated;

create or replace function public.approve_new_passkeys()
returns int language sql security definer set search_path = public, auth as $$
  with ins as (
    insert into public.passkey_approvals (credential_id, user_id, how)
    select w.id, w.user_id, 'added right after a sign-in' from auth.webauthn_credentials w
     where not exists(select 1 from public.passkey_approvals a where a.credential_id = w.id)
       and public.passkey_ok(w.id, w.user_id, w.created_at)
    on conflict do nothing returning 1)
  select count(*)::int from ins;
$$;
revoke all on function public.approve_new_passkeys() from public, anon, authenticated;

create or replace function public.strong_auth()
returns boolean language sql stable security definer set search_path = public, auth as $$
  select coalesce(
    (auth.jwt() ->> 'email') ~* '^test-[^@]*@aspmgmt\.com$'
    or exists (
      select 1 from jsonb_array_elements(case when jsonb_typeof(auth.jwt() -> 'amr') = 'array' then auth.jwt() -> 'amr' else '[]'::jsonb end) a
      where a ->> 'method' in ('passkey', 'otp', 'magiclink')
        and (a ->> 'timestamp') ~ '^[0-9]+$'
        and (a ->> 'timestamp')::bigint > extract(epoch from now())::bigint - 86400
        and (a ->> 'method' <> 'passkey' or not exists(
              select 1 from auth.webauthn_credentials w
               where w.user_id = auth.uid() and not public.passkey_ok(w.id, w.user_id, w.created_at)))
    ), false);
$$;
revoke all on function public.strong_auth() from public, anon;
grant execute on function public.strong_auth() to authenticated, service_role;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.strong_auth() and exists(select 1 from admin_users where user_id = auth.uid());
$$;

create or replace function public.current_admin_role()
returns text language sql stable security definer set search_path = public as $$
  select role from admin_users where user_id = auth.uid() and public.strong_auth();
$$;

create or replace function public.current_artist_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from artists where user_id = auth.uid() and public.strong_auth();
$$;

create or replace function public.current_crew_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from crew_members where user_id = auth.uid() and active and public.strong_auth();
$$;

create or replace function public.current_crew_kind()
returns text language sql stable security definer set search_path = public as $$
  select kind from crew_members where user_id = auth.uid() and active and public.strong_auth();
$$;

create or replace function public.can_use_whatsapp()
returns boolean language sql stable security definer set search_path = public as $$
  select public.strong_auth() and exists(select 1 from admin_users where user_id = auth.uid() and whatsapp_access);
$$;

create or replace function public.is_library_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.strong_auth() and exists(select 1 from admin_users where user_id = auth.uid() and library_access);
$$;

create or replace function public.can_view_library()
returns boolean language sql stable security definer set search_path = public as $$
  select public.strong_auth() and (
    exists(select 1 from admin_users where user_id = auth.uid() and library_access)
    or exists(select 1 from crew_members where user_id = auth.uid() and active and kind in ('social', 'videographer')));
$$;

create or replace function public.can_manage_library()
returns boolean language sql stable security definer set search_path = public as $$
  select public.strong_auth() and (
    exists(select 1 from admin_users where user_id = auth.uid() and library_access)
    or exists(select 1 from crew_members where user_id = auth.uid() and active and kind = 'social'));
$$;

-- Record new approvals every minute (the check above already counts them; this keeps them after old sign-in
-- records are gone).
select cron.unschedule('approve-passkeys') where exists(select 1 from cron.job where jobname = 'approve-passkeys');
select cron.schedule('approve-passkeys', '* * * * *', 'select public.approve_new_passkeys()');

commit;
