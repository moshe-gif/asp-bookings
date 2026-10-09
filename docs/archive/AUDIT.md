# ASP Bookings — Code Audit (2026-09-03)

Scope: full repo (`frontend/index.html`, `backend/proxy.js`, `supabase/migrations/`, `deploy/`,
`.github/workflows/`, and the doc set — `CLAUDE.md`, `WORKFLOWS.md`, `INTEGRATIONS.md`,
`SETUP.md`). Right-sized to this repo's actual scale (~4,600 lines total) rather than run as a
heavyweight multi-service audit — see the note at the bottom on why C (modularity) came back
clean.

Method: one independent fresh-eyes agent review + direct hands-on verification of every claim
below (grep/read against the real files, not taken on faith). Findings below merge both passes;
overlapping findings from the two passes are marked as corroborated.

Also produced: `AUDIT.csv` — same 13 findings as flat rows for Excel/Sheets.

---

## Findings

| # | Category | Finding | File:Line | Short-term reward | Long-term reward | Risk if NOT fixed | Risk FROM fixing | Effort |
|---|----------|---------|-----------|--------------------|--------------------|---------------------|---------------------|--------|
| 1 | SSOT | Commission rate (15%) hardcoded as a literal in 6 places instead of one named constant | see 1a–1c | Low | Medium | Low now, grows if commission ever becomes non-uniform | Very low (pure find/replace, same value) | Small (~45 min) |
| 1a | SSOT | — computed as `price*0.15` in seed data, new-lead submit, and Daily Digest | `index.html:825-826, 4118`, `2016` | | | | | |
| 1b | SSOT | — recomputes `price*0.15` for display instead of reading the event's own stored `commission` field | `index.html:2016` | | | | | |
| 1c | SSOT | — hardcoded again as static "15%"/"85%" UI label text, independent of the computation sites | `index.html:2314, 2809, 3568` | | | | | |
| 2 | SSOT | Two parallel event-status label/order lists — `statusMeta()` and the event-sheet's own `steps`/`order` arrays — describe the same 5-stage pipeline with different wording | `statusMeta()` at `1271`; `steps`/`order` at `3085-3089` | Low | Medium | Medium — a future new/renamed status only gets updated in one place | Low-medium (need to confirm the short labels in `steps` are a deliberate space-saving choice, not a bug, before merging) | Medium (~1-2 hrs incl. testing every transition) |
| 3 | SSOT | Two different "artist payout" numbers appear on the same Financials page and can disagree whenever an event has extra charges | `index.html:2286-2292` vs `2793` (uses `zelleBalance()` = balance + charges) | High | High | Medium-high — real "why don't these numbers match" risk for whoever reads Financials | Medium — **needs a business decision** on which definition is correct before touching code | Small once decided (~1 hr) |
| 4 | SSOT | "Bucket last 6 months, chart against a shared max" logic independently reimplemented 3 times | `index.html:2262-2266, 2337-2343, 2797-2802` | Low | Medium | Low today (all 3 happen to agree) | Low (extract one pure helper) | Small (~45 min) |
| 5 | SSOT | Block Time event creation hardcodes `reminderIntervalDays:5` instead of calling the shared `defaultReminderCadence()` helper used everywhere else | `index.html:4160` | None (currently unread for unpaid days) | Low | Very low today, latent | Very low (one-line fix) | Trivial (~5 min) |
| 6 | Docs (drift) | CLAUDE.md's deploy instructions ("SFTP via `deploy/deploy-index.js`") don't match reality (GitHub Actions → Pages on push to `main`); the SFTP scripts are untouched since the initial commit and would fail outright if run (missing npm dep, no `package.json` in the repo at all, no SFTP host configured) | `CLAUDE.md:17`; `.github/workflows/pages.yml`; `deploy/deploy-index.js` | **High** | High | **High** — this will mislead a future session that trusts CLAUDE.md literally | None (docs-only edit) | Trivial (~10 min) |
| 7 | Docs (gap) | Supabase is the app's real, live auth provider (magic-link + passkey, `index.html:1078-1165`) but is undocumented in both INTEGRATIONS.md (§4 only describes a Google ID-token pattern) and SETUP.md's "accounts you need" list | `INTEGRATIONS.md` §4-5; `SETUP.md` §0 | **High** | High | Medium-high — a fresh session could duplicate auth work or misconfigure a security-sensitive area | None (docs-only) | Small (~20-30 min) |
| 8 | Docs (gap) | `backend/proxy.js` is unconfigured template scaffolding — placeholder `ADMIN_EMAILS`, `verifyIdToken()` always returns an error — and is never called by the live app at all (Ask AI is 100% local keyword matching, zero calls to `/api/claude`). Not a bug today since it isn't deployed, but nothing marks it as inert | `proxy.js:38-44`; confirmed zero `fetch`/`/api/` references anywhere in `index.html` | Low | Medium | Medium — if/when real backend work starts, someone could deploy this as-is believing it's functional | None for the doc-only fix; large if actually implementing real verification (separate project) | Trivial for the doc note (~10 min) |
| 9 | Docs (stale) | `proxy.js`'s own TODO comment tells a future implementer to reference "the Firebase ID-token verifier pattern" — but the app's real IdP is Supabase (JWTs), not Firebase | `proxy.js:41-42` | Low | Low-medium | Medium if/when backend work starts (wrong implementation path) | None (comment-only) | Trivial (~2 min) |
| 10 | Docs/Config (gap) | `.env.example` has no `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` entries even though the real `.env` needs them for the live app's auth to work | `.env.example`; confirmed present in real `.env` | Medium | Medium | Medium — a fresh clone following SETUP.md's "copy .env.example" step ends up with broken auth | None (adds var names only, no secrets) | Trivial (~5 min) |
| 11 | Structure (gap) | `supabase/migrations/*.sql` describe a materially different (richer) schema than the live app — e.g. a `project_type`/stage-pipeline table set for a feature that was since *removed* from the app — with nothing flagging that this is a forward-looking design doc, not the live source of truth. It also already contains a well-matched `artists`/`admin_users` schema worth reusing, not documented as a reusable starting point anywhere | `supabase/migrations/0001_initial_schema.sql`, `0002_auth_linking.sql` | Medium | **High** — this is a real head start on the eventual real-backend migration, worth not losing track of | Medium — future work might redesign the schema from scratch, wasting what's already there | None (docs-only header note + a pointer from project docs) | Trivial (~10 min) |
| 12 | SSOT (minor) | Vestigial `PROJECT_TYPES` single-entry lookup array + `getProjectType()`/`buildProjectTasks()` plumbing, left over from the recent project-types feature removal | `index.html:599-609` (already self-commented explaining why it's still there) | Low | Low | Very low — isolated, already documented inline, no active harm | Low (touches `makeProject`/`buildProjectTasks`/`seedProjects` signatures) | Small (~30-45 min) — **low priority, skip unless doing a broader cleanup pass** |
| 13 | Convention (cosmetic) | ID generation is inconsistent — monotonic counters (`EVID`/`PROJID`/`INVID`/`OBID`) for some collections, `Math.random().toString(36)` for others (charges, board cards, tasks, people) | throughout `index.html` | None | None | Negligible at this scale | Low, but for zero functional gain | Medium — **not recommended**, pure churn |

---

## What's already solid (no fix needed)

- **XSS discipline** — `esc()` is applied consistently across ~200 call sites, including every
  free-text field checked and every URL-builder (`encodeURIComponent` used correctly).
- **Action/render separation** — genuinely clean. Every state mutation lives in a named `do*`
  handler reached only through the central `data-action` dispatcher; no render function was
  found mutating state.
- **Conflict detection** (`findConflicts`/`allConflictPairs`, `index.html:1252-1269`) is a single
  well-factored source of truth reused identically by the calendar, event-creation warnings, the
  dashboard, and Ask AI — this is the pattern the commission-rate and status-list findings above
  should imitate.
- **Modularity is right-sized** — no concrete pain point was found that would justify splitting
  the single-file architecture. This matches what CLAUDE.md already prescribes for a project at
  this stage (single author, trusted users, no build-triggering complexity yet).
- **WORKFLOWS.md accuracy** — its specific implementation claims were spot-checked against code
  and mostly hold up; unusually good documentation-to-code fidelity for a fast-moving tool.

---

## On the request's original points 5–7 (write engineering priorities to CLAUDE.md)

Checked against the current file: **CLAUDE.md's existing "Engineering Priorities" (1-4) and "PR
Process" (steps 1 and 5) already state this almost verbatim** —
"elegance/completely-directly-simply," "limit blast radius," "arcs = minimum to end-to-end test
the real thing, no mocks/sims, atomic commits, waves," and "double-review high-risk work (agent
team + your own hand)" are already there word-for-word, and PR Process step 1 ("re-read the
priorities... before planning") / step 5 ("review the diff... SSOT violations") already cover
"review priorities before planning" and "review PR code." No new section is needed — see the
one small suggested addition in the recommendations below.

---

## Recommendations (Certainty · Timing)

**For Sure, Right Now** — near-zero risk, near-zero effort, real payoff, bundle into one
documentation pass (~1 hour total): **#6, #7, #9, #10, #11**, plus one tiny addition to
CLAUDE.md priority #2 ("limit blast radius") appending "*and downstream-bug risk*" to match your
exact wording — everything else in points 5-7 is already there.

**Very Likely, Soon** — real value, low risk, but #3 needs a quick business decision first:
**#3** (decide which "artist payout" definition is correct, then it's a small fix), **#1**
(commission constant), **#5** (one-line reminder-cadence fix, may as well ride along with #1).

**Worth Doing, Not Urgent** — moderate value, moderate care needed, no deadline pressure:
**#2** (status-list merge — confirm the short labels are intentional first), **#4** (chart
helper extraction), **#8** (proxy.js "not deployed" doc note).

**Skip For Now**: **#12** (only worth it inside a broader cleanup pass), **#13** (explicitly not
worth the churn).
