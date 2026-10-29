-- 0073: WhatsApp tab, round 2 (owner 2026-10-29: "why cant i view responses" / "theres no contact info").
-- 1. Incoming photos, voice notes, videos and documents keep WhatsApp's media id (and type), so the tab can
--    open them (whatsapp-send "media" fetches the file through 360dialog; WhatsApp keeps media for a while only).
-- 2. whatsapp_contacts: names the owner gives a number in the tab (WhatsApp never shares the phone's address
--    book). Read and written only with WhatsApp access.
-- Applied: 2026-10-29 (supabase/run-sql.sh)

begin;
alter table public.whatsapp_messages add column if not exists media_id text;
alter table public.whatsapp_messages add column if not exists media_mime text;

create table if not exists public.whatsapp_contacts (
  contact text primary key check (contact ~ '^[0-9]{8,16}$'),
  name text not null check (length(name) between 1 and 120),
  updated_at timestamptz not null default now()
);
alter table public.whatsapp_contacts enable row level security;
drop policy if exists "whatsapp people manage contacts" on public.whatsapp_contacts;
create policy "whatsapp people manage contacts" on public.whatsapp_contacts for all to authenticated
  using ((select can_use_whatsapp())) with check ((select can_use_whatsapp()));
revoke all on public.whatsapp_contacts from anon, authenticated;
grant select, insert, update, delete on public.whatsapp_contacts to authenticated;
grant all on public.whatsapp_contacts to service_role;
commit;
