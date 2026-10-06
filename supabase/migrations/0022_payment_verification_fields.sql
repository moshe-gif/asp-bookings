-- Durable booking record architecture, PR 2 of 6, part 2. Extends payments (migrations 0012/0018)
-- with the fields the brief explicitly asks be tracked as separate, distinct data: currency,
-- payer, payment rail, destination (some payments go to Airschnitz, some go straight to the
-- artist -- never hardcode this), the expected amount at allocation time, and an allocation_status
-- that is the literal implementation of "never auto-allocate a mismatched payment by amount
-- alone." booking_artist_id lets one payment settle against one artist's share of a multi-artist
-- booking (split deposits).
alter table payments add column currency text not null default 'USD';
alter table payments add column payer text;
alter table payments add column payment_rail text check (payment_rail in ('zelle','wire','check','ach','credit_card','cash','quickbooks_sync','manual_other'));
alter table payments add column destination text check (destination in ('asp_operating','artist_direct','other'));
alter table payments add column expected_amount numeric;
alter table payments add column allocation_status text not null default 'unallocated' check (allocation_status in ('unallocated','allocated','needs_review','disputed'));
alter table payments add column booking_artist_id uuid references event_artists(id);
alter table payments add column evidence_url text; -- manual-evidence fallback for unintegrated payment rails (Invoice2go etc.)
alter table payments add column evidence_note text;
