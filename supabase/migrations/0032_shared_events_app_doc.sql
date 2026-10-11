-- 0032: Shared gigs — the app's full gig record lives in events.app_doc (2026-10-09 audit 3.1, Wave 2 step 1).
-- Applied: <date — fill in when run in Supabase → SQL Editor, AFTER 0031>
--
-- Until now every office browser kept its own copy of the gigs in localStorage, so two staff saw
-- different data and clearing a browser destroyed records. From this migration on, the app stores
-- each gig as ONE complete document (`app_doc`, exactly the record the app already uses) keyed by
-- its app id (`legacy_id`, e.g. "EV-5012"). The browser keeps a copy only as a cache.
--
-- Single source of truth: app_doc. The relational columns (artist_id, date, status, price, …) are
-- a projection DERIVED from app_doc by the trigger below on every insert/update, so reports, RLS
-- and artist_bookings() keep working and can never drift from the document. Do not write those
-- columns directly for rows that have an app_doc.
--
-- Access: unchanged admin-only RLS on events (0001; 0031 removed the artist write policies).
-- Artists still read only their own safe columns via artist_bookings().
--
-- Realtime: events is added to the supabase_realtime publication (RLS applies to who receives
-- changes) with REPLICA IDENTITY FULL so deletes carry legacy_id, letting every open admin screen
-- pick up other people's edits live.

begin;

alter table events add column if not exists legacy_id text unique;
alter table events add column if not exists app_doc jsonb;
-- A gig may reference an artist who has no Supabase artists row yet (artists.legacy_id not set);
-- the document still saves, the projection just leaves artist_id empty until that row exists.
alter table events alter column artist_id drop not null;

create or replace function public.events_from_app_doc() returns trigger
language plpgsql set search_path = public as $$
declare
  d jsonb := new.app_doc;
  dt text;
begin
  if d is null then return new; end if;
  new.legacy_id := d->>'id';
  new.artist_id := (select a.id from artists a where a.legacy_id = d->>'artistId' or a.id::text = d->>'artistId' limit 1);
  new.type := coalesce(nullif(d->>'type',''), 'Other');
  new.unpaid := coalesce((d->>'unpaid')::boolean, false);
  new.client_name := d->>'clientName';
  new.client_email := d->>'clientEmail';
  new.client_phone := d->>'clientPhone';
  dt := nullif(d->>'date','');
  new.date := coalesce(dt::date, new.date, current_date);
  new.time := coalesce(d->>'time', '');
  new.end_time := d->>'endTime';
  new.venue := coalesce(d->>'venue', '');
  new.city := coalesce(d->>'city', '');
  new.state := coalesce(d->>'state', '');
  new.price := coalesce(nullif(d->>'price','')::numeric, 0);
  new.commission := coalesce(nullif(d->>'commission','')::numeric, 0);
  new.balance := new.price - new.commission;
  new.status := coalesce(nullif(d->>'status',''), 'lead');
  new.booking_status := d->>'bookingStatus';
  new.deposit_received := coalesce((d->>'depositReceived')::boolean, false);
  new.deposit_received_date := nullif(d->>'depositReceivedDate','')::date;
  new.balance_received := coalesce((d->>'balanceReceived')::boolean, false);
  new.balance_received_date := nullif(d->>'balanceReceivedDate','')::date;
  new.reminder_interval_days := nullif(d->>'reminderIntervalDays','')::int;
  new.last_reminder_sent := nullif(left(d->>'lastReminderSent',10),'')::date;
  new.flight_needed := coalesce((d->>'flightNeeded')::boolean, false);
  new.flight_booked := coalesce((d->>'flightBooked')::boolean, false);
  new.flight := d->'flight';
  new.ground_transport_needed := coalesce((d->>'groundTransportNeeded')::boolean, false);
  new.ground_transport_booked := coalesce((d->>'groundTransportBooked')::boolean, false);
  new.ground_transport := d->'groundTransport';
  new.dress_code := coalesce(d->>'dressCode', '');
  new.artist_paid_out := coalesce((d->>'artistPaidOut')::boolean, false);
  new.artist_paid_out_date := nullif(d->>'artistPaidOutDate','')::date;
  return new;
end $$;

drop trigger if exists events_from_app_doc on events;
create trigger events_from_app_doc
  before insert or update of app_doc on events
  for each row execute function public.events_from_app_doc();
revoke execute on function public.events_from_app_doc() from public, anon, authenticated;

alter table events replica identity full;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events') then
    alter publication supabase_realtime add table events;
  end if;
end $$;

commit;
