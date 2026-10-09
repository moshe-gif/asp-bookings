Working directory: /Users/sonnenscheinfam/asp-bookings

Read AUDIT.md and AUDIT.csv in this repo first — I already ran a full codebase audit and this is
Wave 3 of the follow-up work: findings #2, #4, #8. Lower urgency than Waves 1-2 (do this after
them, or independently — it doesn't conflict with Wave 2's edits, just touches nearby code, so
do it as its own commit after Wave 2 has landed to keep diffs clean rather than in parallel).

## #2 — Two parallel event-status label/order lists
`statusMeta()` (~`frontend/index.html:1271`) is the canonical map of status keys to labels/pill
styles used almost everywhere in the app (e.g. `lead → 'New Lead'`). But `renderEventSheet`
(~`frontend/index.html:3085-3089`) defines its OWN separate `steps` array with different labels
for the same 5 statuses (e.g. `lead → 'Lead'`, not 'New Lead') plus a third derived `order` array
— all three describing the identical lead→negotiating→contract_sent→booked→paid pipeline.

Before merging: figure out WHY the event-sheet timeline uses shorter labels ('Lead' vs 'New
Lead', etc.) — check if it's a deliberate space-saving choice for the horizontal timeline
component (`.tl-step`/`.tl-label`, narrow flex items) vs. `statusMeta()`'s labels being used in
wider contexts (table cells, pills with more room). If it IS deliberate, the right fix is to add
a `shortLabel` field to `statusMeta()`'s existing map and have the timeline read
`statusMeta(ev).shortLabel` instead of maintaining its own separate array — one source of truth,
two label lengths, not two competing lists. If the difference turns out to be accidental (nobody
actually needed it shorter, it just drifted that way when the timeline was built), just use
`statusMeta()`'s regular label directly and delete `steps`/have the timeline derive from the
same status-key order that `statusMeta` implies.

Either way: end state should be ONE canonical ordered list of status keys (with regular +
optional short labels), read by both `statusMeta()`'s callers and the event-sheet timeline — not
three independently-maintained arrays that all have to be kept in sync by hand when a status is
ever added, renamed, or reordered.
Verify: render the event sheet for an event at every one of the 5 statuses, confirm the timeline
still shows the correct stage highlighted with the correct label at each one, exactly as before.

## #4 — Chart month-bucketing logic reimplemented 3x
The same "build the last 6 months, sum matching events into each bucket, compute bar heights
against a shared max" logic is independently written three separate times:
- Management Monthly Gross chart (~`frontend/index.html:2262-2266`)
- Management per-artist trend sparkbars (~`frontend/index.html:2337-2343`)
- Artist-side Monthly Payout chart (~`frontend/index.html:2797-2802`)

Fix: extract one shared helper, e.g. `function monthlyBuckets(events, valueFn, months=6){...}`
that returns `[{label, val}, ...]` for the trailing N months, given an event list and a function
that extracts the dollar value to sum per event (so it works for gross revenue, per-artist
totals, and artist payout alike — each caller just passes a different `valueFn`). Replace all
three call sites to use it. Keep each chart's own bar-height/rendering code as-is (that part
differs cosmetically between the three); only extract the bucketing/summing logic itself.
Verify: all three charts render identical numbers/bar heights before and after — this should be
a pure refactor.

## #8 — proxy.js is dormant scaffolding with nothing marking it inert
`backend/proxy.js` still has the literal template placeholder `ADMIN_EMAILS =
['<you@company.com>']` and `verifyIdToken()` unconditionally returns an error — meaning every
`/api/*` route would 401 if this file were deployed as-is today. It's also never actually called
by the live app (confirm: no `fetch`/`/api/` reference anywhere in `frontend/index.html` — Ask AI
is 100% local keyword matching). None of this is a live bug since the file isn't deployed, but
nothing in the file itself flags that state to someone opening it fresh.

Fix: add a short header comment at the top of `backend/proxy.js` stating plainly: this file is
NOT currently deployed for asp-bookings (the live app is a static GitHub Pages site with no
backend calls); `ADMIN_EMAILS` and `verifyIdToken()` are still unconfigured template stubs from
the app-starter-kit scaffold; before ever deploying this, real Supabase JWT verification needs to
be implemented (see #9 from Wave 1 if that's landed) and `ADMIN_EMAILS` needs real values. This is
a documentation fix, not an implementation task — don't implement real `verifyIdToken()` here
unless separately asked to.

## When done
Report back a short summary of what changed, and confirm each of the three chart displays and
the event-sheet timeline were checked against their pre-change appearance.
