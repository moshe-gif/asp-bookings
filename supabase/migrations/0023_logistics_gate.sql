-- Durable booking record architecture, PR 3 of 6, part 1 of 3. Logistics-readiness gate (brief:
-- "per-field owner/due-date/evidence/status, computed readiness, no automatic external send").
-- logistics_field_requirements is a small reference table (which fields are required per
-- booking_type, how far ahead they're due) -- booking_logistics_fields is the actual per-event
-- checklist. "Logistics ready" is deliberately NOT a stored column: it's computed at read time as
-- "every required field for this event's type has a confirmed row or a non-null exception_reason"
-- -- storing it would create a second source of truth that could drift from the fields themselves.

create table logistics_field_requirements (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  field_key text not null,
  target_weeks_before int not null default 2,
  required boolean not null default true,
  unique (event_type, field_key)
);
alter table logistics_field_requirements enable row level security;
create policy "admin manages logistics field requirements" on logistics_field_requirements for all using (is_admin()) with check (is_admin());

create table booking_logistics_fields (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  field_key text not null,
  status text not null default 'unknown' check (status in ('unknown','requested','proposed','confirmed')),
  owner uuid references admin_users(id),
  due_at timestamptz,
  evidence_note text,
  evidence_url text,
  confirmed_by uuid references auth.users(id),
  confirmed_at timestamptz,
  -- A deliberate, logged staff override for a field that will never be confirmed the normal way
  -- (e.g. a venue that refuses to confirm load-in time in writing) -- same "never silently skip"
  -- principle as booking_exceptions (migration 0021). Non-null here counts as "ready" alongside
  -- status='confirmed' in the readiness computation.
  exception_reason text,
  exception_logged_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (event_id, field_key)
);
alter table booking_logistics_fields enable row level security;
create policy "admin manages booking logistics fields" on booking_logistics_fields for all using (is_admin()) with check (is_admin());
-- Per the access matrix: an artist may see the logistics fields for an event they're booked on
-- (read-only -- only admin/ops ever writes a logistics field), never another artist's event.
create policy "artist sees own-event logistics fields" on booking_logistics_fields for select
  using (exists (
    select 1 from event_artists ea
    where ea.event_id = booking_logistics_fields.event_id and ea.artist_id = current_artist_id()
  ));
