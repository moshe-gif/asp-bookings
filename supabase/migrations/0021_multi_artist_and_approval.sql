-- Durable booking record architecture, PR 2 of 6. Extends event_artists (migration 0012, shape
-- unchanged otherwise -- it's already the right per-artist-RLS-scoped table, just needs two more
-- fields) and adds the contract-approval gate the spec calls "money/term changes need approval
-- before outbound comms." Also adds the two structured tables the state machine needs for a real
-- audit trail: booking_exceptions (a deliberate, logged staff override -- e.g. confirming a
-- booking without a matched payment) and booking_status_history (every transition, queryable, not
-- just prose in activity_log).

alter table event_artists add column gross_fee numeric; -- "own fee" in the brief's own wording
alter table event_artists add column expenses_charged numeric not null default 0; -- artist-attributed costs netted out of net_amount

alter table contracts add column approved_by uuid references admin_users(id);
alter table contracts add column approved_at timestamptz;
alter table contracts add column accepted_version_number int; -- set once a real signature flow exists; null until then, not a placeholder

create table booking_exceptions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id),
  exception_type text not null check (exception_type in ('payment_verification_waived','logistics_gap_accepted','other')),
  reason text not null,
  linked_payment_id uuid references payments(id), -- payments already exists (0012), FK added directly
  logged_by uuid not null references admin_users(id),
  logged_at timestamptz not null default now()
);
alter table booking_exceptions enable row level security;
create policy "admin manages booking exceptions" on booking_exceptions for all using (is_admin()) with check (is_admin());

create table booking_status_history (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id),
  from_status text,
  to_status text not null,
  trigger_type text not null check (trigger_type in ('manual','system','webhook')),
  triggered_by uuid references auth.users(id),
  payment_id uuid references payments(id),
  exception_id uuid references booking_exceptions(id),
  note text,
  created_at timestamptz not null default now()
);
alter table booking_status_history enable row level security;
create policy "admin manages status history" on booking_status_history for all using (is_admin()) with check (is_admin());
