-- Additive, id-preservation columns for the localStorage -> Supabase import tool (Phase 1). The
-- app's events (S.events, ~215 real imported gigs as of this migration) have not been migrated
-- into the existing `events` table yet -- that's its own careful pass, given the volume and that
-- every imported gig is still marked needsReview. Until then, contracts.lead_id has nothing to
-- resolve to, so this preserves the original localStorage id ("EV-1063" etc.) as a plain-text
-- external reference per "keep legacy IDs as external references where not [preservable as the
-- real FK]" -- once events are migrated, a follow-up pass can backfill lead_id from this column.
alter table contracts add column if not exists legacy_lead_id text;
alter table contracts add column if not exists legacy_id text; -- the original "CT-123" contract id
alter table payee_profiles add column if not exists legacy_id text; -- the original "PP-123" id
alter table external_events add column if not exists legacy_id text;
