-- 0071: The office WhatsApp in the app (owner 2026-10-29: "make a whatsapp tab on the app only visible to my
-- account"). Every message the app sends, and every message to the office number (via 360dialog's webhook),
-- lands in whatsapp_messages; the owner reads the conversations and replies in the app.
--
-- 1. admin_users.whatsapp_access: who may open it (the owner). Like library_access, it can only be changed by
--    SQL (the 0070 trigger now guards both columns), so no admin can give it to themselves.
-- 2. whatsapp_messages: one row per message (in or out), keyed by WhatsApp's message id; delivery status
--    updates in place. Written only by the server (the shared sender and the webhook); read only with access.
--
-- Applied: 2026-10-29 (supabase/run-sql.sh)

begin;

alter table public.admin_users add column if not exists whatsapp_access boolean not null default false;

create or replace function public.guard_library_access() returns trigger
  language plpgsql set search_path = public
  as $$ begin
    if coalesce(auth.role(), '') in ('authenticated', 'anon') and (
         (tg_op = 'INSERT' and (new.library_access or new.whatsapp_access))
      or (tg_op = 'UPDATE' and (new.library_access is distinct from old.library_access or new.whatsapp_access is distinct from old.whatsapp_access))) then
      raise exception 'library and WhatsApp access are set by the owner';
    end if;
    return new;
  end; $$;

create or replace function public.can_use_whatsapp() returns boolean
  language sql stable security definer set search_path = public
  as $$ select exists(select 1 from admin_users where user_id = auth.uid() and whatsapp_access) $$;
revoke execute on function public.can_use_whatsapp() from public, anon;
grant execute on function public.can_use_whatsapp() to authenticated;

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  wa_id text unique,
  direction text not null check (direction in ('in', 'out')),
  contact text not null,                 -- the other side's number, digits only (E.164 without "+")
  contact_name text,
  body text,
  kind text not null default 'text',
  status text,                           -- out: sent / delivered / read / failed; in: received
  error text,
  real_to text,                          -- test mode: who it was meant for (it went to the test phone)
  sent_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists whatsapp_messages_contact on public.whatsapp_messages (contact, created_at desc);

alter table public.whatsapp_messages enable row level security;
drop policy if exists "whatsapp people read messages" on public.whatsapp_messages;
create policy "whatsapp people read messages" on public.whatsapp_messages for select to authenticated
  using ((select can_use_whatsapp()));
revoke all on public.whatsapp_messages from anon, authenticated;
grant select on public.whatsapp_messages to authenticated;
grant all on public.whatsapp_messages to service_role;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'whatsapp_messages') then
    alter publication supabase_realtime add table public.whatsapp_messages;
  end if;
end $$;

commit;
