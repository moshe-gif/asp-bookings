Working directory: /Users/sonnenscheinfam/asp-bookings

Read AUDIT.md and AUDIT.csv in this repo first — I already ran a full codebase audit and this is
Wave 2 of the follow-up work: findings #1, #3, and #5, all small SSOT fixes to
`frontend/index.html`. Moshe (the owner) has already confirmed the one business-logic call this
needs: for #3, "artist payout" should mean **balance + charges** (what the artist actually
receives, including reimbursed extras like travel/hotel) — that's already what `zelleBalance()`
computes and what the "Owed to Artists"/"Paid Out" rows on Financials already use. The other
figure (balance-only, in the top "Artist Payouts" stat tile) is the one to fix, not the correct
one to propagate elsewhere.

Do all three in one session. They touch the same file but different, non-overlapping regions —
fine to do sequentially in one commit, or as separate small commits if that reads cleaner to you;
your call, just keep each commit's diff easy to review.

## #1 — Commission rate hardcoded in 6 places
The 15% commission rate is a hardcoded literal (`price*0.15` or the string "15%"/"85%") in at
least 6 spots instead of one named constant:
- Computed as `price*0.15`: seed-data generation (~`index.html:825-826`), the Daily Digest
  "Awaiting Down Payment" row (~`index.html:2016` — this one is worse: it *recomputes*
  `price*0.15` for display instead of reading the event's own already-stored `commission` field),
  and the new-lead submit handler (~`index.html:4118`).
- Hardcoded as static UI label text, independent of the computation sites: ~`index.html:2314,
  2809, 3568` (things like "Commission Rate: 15%" / "85% via Zelle").

Fix: add one named constant (e.g. `const COMMISSION_RATE = 0.15;` near wherever similar
top-level constants like `OVERTIME_PER_HALF_HOUR` already live, for consistency with existing
convention) and:
- Replace every `*0.15` computation site with `* COMMISSION_RATE`.
- Fix the Daily Digest line specifically to read `e.commission` (the value already stored on the
  event) instead of recomputing — this is the one that's an actual latent-bug risk, not just
  style.
- Replace the hardcoded "15%"/"85%" label strings with values derived from the constant (e.g.
  `${COMMISSION_RATE*100}%` and `${100-COMMISSION_RATE*100}%`), so a future rate change is a
  one-line edit, not a six-site hunt.
Verify: commission math and displayed percentages are unchanged before/after (this should be a
pure refactor, no behavior change) — spot check a real event's commission breakdown and the Daily
Digest page render identically.

## #3 — Two different "artist payout" numbers on Financials
`frontend/index.html` around `2286-2292` computes the top "Artist Payouts" stat tile as
`booked.reduce((s,e)=>s+e.balance,0)` — balance only, excluding any charges. Further down the
same page (~`index.html:2793`), "Owed to Artists"/"Paid Out" use `zelleBalance(e)` (`balance +
chargesTotal(e)`) — the correct definition per Moshe.

Fix: change the top stat tile's computation to also use `zelleBalance(e)` (or equivalently sum
`e.balance + chargesTotal(e)` per event) so both numbers on the page agree. Grep for any OTHER
place on this page or the artist-side Financials page that computes an "artist payout"-style
total using `e.balance` alone instead of `zelleBalance(e)` — fix those too if found, so this
becomes a single convention (payout = zelleBalance) applied consistently, not just patched in the
two spots already found.
Verify: pick a real event with a non-zero charge, confirm the top stat tile and the itemized
rows now agree on that event's payout amount.

## #5 — Block Time bypasses the shared reminder-cadence helper
`doSubmitBlockTime` (~`frontend/index.html:4160`) hardcodes `reminderIntervalDays:5` on the
events it creates, instead of calling `defaultReminderCadence(date)` like every other
event-creation path does (`index.html:876, 918, 3916, 4129`). Currently harmless (blocked/unpaid
days never read this field to send a reminder), but it's the one live counterexample to
WORKFLOWS.md §4's claim that the default now always comes from the shared helper.
Fix: one-line change — call `defaultReminderCadence(date)` instead of the literal `5`, matching
the other four call sites exactly.

## When done
Report back a short summary of what changed, and flag if you found any additional "artist payout
computed without charges" spots beyond the two already named in #3 — those would need the same
fix.
