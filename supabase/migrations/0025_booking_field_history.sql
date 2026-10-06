-- Durable booking record architecture, PR 3 of 6, part 3 of 3. Structured field-change history
-- (date/time/venue/price edits, including an explicit move TO unknown) -- today these changes are
-- only visible as prose in activity_log, if logged at all. old_value/new_value are text so any
-- field type can be recorded uniformly; NULL means "was/is explicitly unknown," never a
-- placeholder empty string -- mirrors the same NULL-means-unknown convention migration 0020 used
-- for events.date/time.

create table booking_field_history (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  field_name text not null,
  old_value text,
  new_value text,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now(),
  reason text
);
alter table booking_field_history enable row level security;
create policy "admin manages booking field history" on booking_field_history for all using (is_admin()) with check (is_admin());
