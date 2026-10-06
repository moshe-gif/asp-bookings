-- Durable booking record architecture, PR 1 of 6 (see the booking-architecture plan for the full
-- design -- gap table, access matrix, state machine, PR sequence). Purely additive/relaxing: no
-- existing column is dropped or renamed, no existing constraint is tightened, nothing here changes
-- what the live app does today (events/projects stay 100% localStorage until a later, separately
-- approved PR switches a read path). This just removes two forced-field assumptions that don't
-- hold for the broader booking model the brief asks for, and adds columns nothing writes to yet.
--
-- Why artist_id/date/time need to stop being NOT NULL: a booking should be representable from the
-- 'inquiry' stage, before a date is set and before (for a non-gig production project, or a
-- multi-artist package) there's a single artist to assign. Multi-artist linkage already has a home
-- in event_artists (migration 0012) -- events.artist_id stops being load-bearing for "who's
-- booked" once that's wired up, so relaxing it now is safe groundwork, not a behavior change today
-- (every existing row already has a real artist_id/date/time; this only affects what a NEW insert
-- is allowed to omit).
alter table events alter column artist_id drop not null;
alter table events alter column date drop not null;
alter table events alter column time drop not null;

alter table events add column booking_type text not null default 'gig' check (booking_type in ('gig','production'));
alter table events add column title text; -- for production work with no venue/artist-shaped name
alter table events add column agent_fee numeric; -- distinct from ASP's own commission/cut
alter table events add column deposit_expected_amount numeric; -- frozen at contract-sent, see the state machine

-- New enum-driven status column, additive alongside the existing free-text `status` (left
-- completely untouched -- doMarkDeposit/doMarkBalance/etc. keep working exactly as they do today).
-- The cutover from `status` to `booking_status` is its own later, separately-tested step, not
-- bundled into this migration.
alter table events add column booking_status text;

-- Same artist_id fix on projects, for the same "non-gig work without a fake artist" reason.
alter table projects alter column artist_id drop not null;
