-- Post-event thank-you + chat intake (owner 2026-10-23 gap fixes). NOT applied yet: the owner applies
-- it by hand in the SQL Editor after review, before deploying send-thanks / intake-lead.
--
-- 1) Thank-you emails are reviewed drafts sent one at a time by an admin (send-thanks). They are
--    logged in client_followups like the reminders, and a gig can only ever be thanked once: the
--    function claims the row (ok = true) BEFORE sending and flips it to ok = false if the send fails,
--    so a double click or two admins at once can't send twice, and a failed send can be retried.
-- 2) Chat intake (intake-lead, not wired to anything yet): intake_create_lead() allocates the next
--    EV- id and inserts the gig in ONE transaction under a lock, so two calls at once can't collide,
--    and records the caller's idempotency key so a repeat creates nothing. Server-only (service role).

alter table public.client_followups drop constraint if exists client_followups_kind_check;
alter table public.client_followups add constraint client_followups_kind_check
  check (kind in ('deposit_reminder', 'balance_reminder', 'post_event_thanks'));
create unique index if not exists client_followups_one_thanks
  on public.client_followups (event_legacy_id) where kind = 'post_event_thanks' and ok;

create table if not exists public.intake_requests (
  idempotency_key text primary key check (length(idempotency_key) between 8 and 200),
  legacy_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists intake_requests_time on public.intake_requests (created_at desc);
alter table public.intake_requests enable row level security;   -- no policies: nobody but the server
revoke all on public.intake_requests from public, anon, authenticated;
grant all on public.intake_requests to service_role;

-- One row per message intake-lead sends to the AI (created or not), so its hourly cap on AI reads holds
-- even when messages fail; intake-lead deletes rows older than a day.
create table if not exists public.intake_attempts (at timestamptz not null default now());
create index if not exists intake_attempts_time on public.intake_attempts (at desc);
alter table public.intake_attempts enable row level security;
revoke all on public.intake_attempts from public, anon, authenticated;
grant all on public.intake_attempts to service_role;

-- Returns the gig's legacy_id and whether it was created now (false = the key was seen before).
-- p_doc is the app_doc without an id; the id is added here. Raises 'intake rate limit' past
-- p_max_per_hour new leads in the last hour.
create or replace function public.intake_create_lead(p_key text, p_doc jsonb, p_max_per_hour int default 20)
returns table (legacy_id text, created boolean)
language plpgsql security definer set search_path = public as $$
declare
  existing text;
  n int;
  id text;
  tries int := 0;
begin
  perform pg_advisory_xact_lock(hashtext('intake_create_lead'));
  select r.legacy_id into existing from intake_requests r where r.idempotency_key = p_key;
  if existing is not null then return query select existing, false; return; end if;
  if (select count(*) from intake_requests r where r.created_at > now() - interval '1 hour') >= p_max_per_hour then
    raise exception 'intake rate limit';
  end if;
  select greatest(1000, coalesce(max((substring(e.legacy_id from '^EV-(\d+)$'))::int), 0) + 1) into n
    from events e where e.legacy_id ~ '^EV-\d+$';
  loop
    id := 'EV-' || n;
    -- legacy_id is unique; an id an office browser took meanwhile just moves us to the next number.
    insert into events (legacy_id, app_doc) values (id, p_doc || jsonb_build_object('id', id))
      on conflict on constraint events_legacy_id_key do nothing;
    exit when found;
    n := n + 1; tries := tries + 1;
    if tries > 50 then raise exception 'intake could not allocate an id'; end if;
  end loop;
  insert into intake_requests (idempotency_key, legacy_id) values (p_key, id);
  return query select id, true;
end $$;
revoke execute on function public.intake_create_lead(text, jsonb, int) from public, anon, authenticated;
grant execute on function public.intake_create_lead(text, jsonb, int) to service_role;
