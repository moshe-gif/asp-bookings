-- 0088: a private calendar feed per singer (owner 2026-11-10: "it should auto update his calendar, are these
-- needed" -- about the per-gig "Add to Google Calendar" / "Download .ics" buttons).
-- The singer subscribes once (Google Calendar "From URL", or iPhone Settings -> Calendar -> Add Subscribed
-- Calendar) and their gigs show and update by themselves. The feed is read by the public `cal-feed` Edge
-- Function, which trusts only this random token. No money is ever in the feed.
-- Only the service role reads this table (RLS on, no policies): the singer gets their link from cal-feed.
--
-- Applied: 2026-11-10 (supabase/run-sql.sh)

begin;
create table if not exists public.calendar_feeds (
  artist_id uuid primary key references public.artists(id) on delete cascade,
  token text not null unique check (length(token) >= 40),
  created_at timestamptz not null default now(),
  last_read_at timestamptz
);
alter table public.calendar_feeds enable row level security;
revoke all on public.calendar_feeds from anon, authenticated;
commit;
