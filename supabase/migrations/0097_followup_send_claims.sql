-- 0097: claim each automatic message before sending it (2026-11-12 audit #2.2).
-- client-followups sent first and wrote its "sent" row after, without checking that the write worked. A failed
-- write (or a crash in between, or two runs at once) meant the next run sent the same message again.
-- Now each send first inserts its row with a claim_key (kind|gig|ref, or kind|gig|@day for the weekly reminders);
-- the unique index lets only one run claim it. A sent message keeps its key for good; a failed one gives its key
-- up so a later run can try again; a run that dies mid-send leaves the key held, so it is never sent twice (the row
-- reads "sending", and older than an hour the function marks it interrupted for the office to check).
-- Applied: (run by supabase/run-sql.sh)

begin;
alter table public.client_followups add column if not exists claim_key text;
create unique index if not exists client_followups_claim on public.client_followups (claim_key) where claim_key is not null;
commit;
