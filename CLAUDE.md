# ASP Bookings — Engineering Guide (CLAUDE.md)

> Loaded into every Claude Code session for this repo. It encodes the owner's build style so a
> fresh session — on any machine, any git account, with no prior memory — builds the same way.
> **Read Engineering Priorities + Security + PR Process before planning any change.**
> (This file started from the owner's generic "App Starter Kit" template; everything below the
> facts section is the owner's standing rules. Where a generic rule names something this repo
> doesn't have — a proxy, SFTP — the facts section wins.)

## This repo — facts (keep current; last verified 2026-10-09)
- **What it is:** ASP Bookings, the booking/ops app for ASP Management — live at
  https://app.aspmgmt.com. GitHub `moshe-gif/asp-bookings` — **the repo is PUBLIC**, and so is
  everything under `frontend/`. Never commit client personal data, bank/account numbers, secrets,
  or an audit that describes unfixed security holes.
- **Frontend:** `frontend/index.html` (24-line shell) + `frontend/styles.css` +
  `frontend/workspaces/asp.js` (~8k lines, the whole ASP workspace) + `sw.js` + `manifest.json`.
  Vanilla JS, no build step, no framework: global `S` state, `render()` rebuilds via `innerHTML`,
  delegated `data-action` handlers, `data-form`/`data-field` binding, `esc()` on ALL interpolation.
  `workspaces/vox.js` and a `shell.js` do **not** exist yet (planned second workspace; the
  `window.Workspaces.asp` mount/unmount contract is still a stub).
- **Deploy:** push to `main` → GitHub Actions (`.github/workflows/pages.yml`) → GitHub Pages
  (custom domain via `frontend/CNAME`, HTTPS enforced). The owner wants changes auto-pushed, so
  **a push is a production deploy** — run the harness first.
- **Backend = Supabase** project `psgpxbkncuavlnpplykf`:
  - Auth: passkeys + emailed one-time code (see INTEGRATIONS.md §4). Passkeys are bound to
    `app.aspmgmt.com`. New staff are created in Supabase → Authentication → Add user; a trigger
    (`link_new_user_to_roster`) links them to their `admin_users`/`artists` row by email.
  - DB: `supabase/migrations/` — **applied by hand** in Supabase → SQL Editor, strictly in number
    order; add an `-- Applied: <date>` header line when run. There is no migration ledger yet.
  - Edge Functions: `supabase/functions/*` — deployed by pasting into the dashboard; JWT
    verification is on except for OAuth callbacks/webhooks (see each `ops/*_SETUP.md`).
    Secrets live in Edge Function secrets, never in the frontend.
- **Where data lives today:** mostly in each browser's **localStorage** (`asp_mock_*` keys —
  real data despite the name: events/gigs, contracts, payee profiles, projects, invoices, outside
  bookings, documents, travel requests, pricing, org settings). Supabase tables exist for most of
  these but are only partly written and mostly not read yet. Each office browser is its own copy:
  never clear or "reset" localStorage, and never bump a storage key to reset data.
- **Not used:** `backend/proxy.js` and `deploy/*.js` are unused starter-kit templates (never
  deployed; the frontend makes no `/api/*` calls). Ignore the generic proxy/SFTP wording below.
- **Tests:** `test-harness/` (Python Playwright, real browser) — runs against the **production**
  Supabase project with dedicated `test-*@aspmgmt.com` accounts; see its README.
- **Docs:** `INTEGRATIONS.md` (integration catalog + what's live), `WORKFLOWS.md`, `SETUP.md`,
  `ops/*_SETUP.md` (one per integration). `docs/archive/` is historical — never execute it.

Wiring in any third-party capability (email, payments, maps, scheduled jobs, LLM, push, PDF…)?
**Read `INTEGRATIONS.md` first.** Pattern here: Edge Function + migration + `ops/<NAME>_SETUP.md`
+ Settings card + a harness spec.

## Source-of-truth map (concept → owner today → target)
| Concept | Owner today | Target |
|---|---|---|
| Gigs/events | localStorage per browser | Supabase `events` |
| Contracts & versions | localStorage per browser | Supabase `contracts` / `contract_versions` |
| Payee profiles (bank, Zelle, default fee) | localStorage + seed literals | Supabase `payee_profiles` (admin-only) |
| Artist roster | `ARTISTS` seed + localStorage + Supabase `artists` | Supabase `artists` |
| Admin roster | Supabase `admin_users` | same (key identity by uuid, not role) |
| Event balance / artist payout | `eventBalance()` / `zelleBalance()` (derived) | same (rename to `artistPayout`) |
| Contract money | `contractPaymentFigures()` (derived) | same |
| Commission rate | literal `0.15` in 3 places | one `COMMISSION_RATE` |
| Event statuses | `statusMeta()` + inline arrays | `EVENT_PIPELINE` + `STATUS_GROUPS` |
| Views / nav | nav arrays + `pageTitle` + `renderView` + CSS hide-list | one `VIEWS` registry |
| Brand / sender | Supabase `brand_config` via `getBrandConfig()` (+ legacy `DOC_BRANDS`) | `brand_config` |
| Sign-in email template | `supabase/templates/signin-code.html` (pasted to dashboard) | same |
| Schema | `supabase/migrations/` (hand-applied) | same + ledger |

## Conventions to reuse
- `updateEvent(id, patch)` + `reportEventSave()` for event writes (concurrency check + visible
  failure). Build a patch object; don't mutate `ev.*` first.
- Derive, don't store (`eventBalance`, `contractPaymentFigures`).
- Additive-defaults migrations for stored shapes (`migrateContract`, `migratePayeeProfiles`):
  fill `undefined`, never overwrite user data.
- Getter facades (`getContract`, `getPayeeProfile`, `getBrandConfig`) as strangler-fig seams.
- `[key,label]` registries + lookup helpers (`PAYMENT_METHODS`) instead of inline lists.
- Idempotency markers on multi-step side effects (`qboInvoiceId`, `calendarHoldsStatus`).
- Dated "why" comments on non-obvious decisions.

## Conventions being phased out (strangler-fig) — and how to live with them meanwhile
- localStorage as the system of record → Supabase, one collection at a time. Meanwhile: never
  clear it; never bump a key; additive migrations only.
- Silent `catch(e){}` saves → report failures like `saveEvents()`.
- Inline literals (`['booked','paid']`, `0.15`, "85%") → shared constants. Meanwhile: add no new ones.
- The giant `switch(action)` / `pageTitle` / `renderView` chains / CSS nav hide-lists →
  `ACTIONS` / `VIEWS` registries. Meanwhile: new entries go in a registry first.
- Hand-rolled `fetch(.../functions/v1/...)` → one helper that requires a session.
- Mock "sent/emailed" log lines → only log what actually happened.
- "mock" / "Demo Mode" names on real data → accurate names via a read-old/write-new shim (don't
  rename storage keys directly).
- `fmtISO(new Date())` for "today" (UTC) → a local-date helper.

---

## Engineering Priorities (read before planning any PR)
**Before planning ANY PR, re-read this section and Security below. Before committing ANY PR,
review its code (see PR Process step 5).** These are the owner's standing rules for every change.

1. **Elegance.** Completely, directly, simply solve the problem. Reuse an existing convention
   over inventing one; delete/strangle bad patterns rather than duplicate them. No band-aids
   that leave the root cause in place.
2. **Limit blast radius and downstream-bug risk.** Fewest call sites, local + additive +
   reversible changes; preserve out-of-scope behavior. Replace patterns strangler-fig (new path
   beside old → migrate → remove old last), never big-bang rewrites.
3. **Scope in user-meaningful arcs.** An arc = the minimum to end-to-end test a real user-facing
   capability against the REAL thing (no mocks/sims). Atomic commits; tightly-scoped PRs; split
   sequential work into ordered waves.
4. **Double-review high-risk work** (agent-review team + your own hand) before merge.
5. **Verify on the REAL app** (browser/backend), not just that it compiles. Report outcomes
   faithfully — if something is unverified, say so.
6. **Single source of truth.** Before adding state/a collection, confirm the concept isn't already
   owned somewhere. Never create a second source of truth.

## Security (non-negotiable)
- **HTTPS everywhere, always.** Never ship plain HTTP. Static hosts give automatic TLS; on a
  server use nginx + Let's Encrypt with a force-HTTPS redirect + HSTS. See SETUP.md.
- **Never trust the client.** The server validates everything. Any client-side gate (e.g. a PIN)
  is convenience only and must NOT be the real authorization boundary.
- **Secrets live server-side only.** API keys never reach the browser — here they live in Supabase Edge Function secrets.
  Encrypt sensitive tokens at rest (AES-256-GCM; key in a separate `0600` file or a secrets store).
- **Gate every `/api/*` route** behind verified auth (e.g. a verified identity-provider ID token,
  signature-checked, with issuer/audience/expiry + an allowlist). Mark privileged routes admin-only.
- **Lock CORS** to the app's own origin (not `*`). **Rate-limit** the proxy.
- **Guard against SSRF** on any server-side fetch (allowlist hosts, block private IPs).
- **Hardware/financial-control APIs (e.g. vehicle command, payments): treat the signing/secret key
  as a crown jewel** — server-only, encrypted, admin-gated, rate-limited, audit-logged, with explicit
  confirmation for actuating commands; request minimum OAuth scopes; never log tokens.

## UI aesthetic (corporate/professional SaaS, never cheesy)
- One brand accent color used sparingly (active states, primary actions); everything else a neutral
  gray/off-white scale with tiered text hierarchy. Pick concrete colors per project.
- Soft depth, not gloss: small-to-medium radius, low-opacity layered shadows, hairline borders.
- Typography: Inter/system for body; a distinct display face for big numbers/titles; UPPERCASE
  micro-labels with letter-spacing for stat labels / table headers / section labels. Antialiased.
- Data-dense but breathable; subtle ~.15–.2s transitions and tiny hover lift only.
- Mobile = native-app feel (bottom nav, safe-area insets, bottom-sheet modals), not a shrunk desktop.
- Avoid: loud gradients, neon glows, shadow overload, decorative emoji chrome, blobby shapes,
  comic fonts, skeuomorphism, gimmicky animation. When unsure, choose the more restrained option.

## When to abandon "no build step"
No-build single-file is correct for internal tools with known/trusted users, and scales to many
users — user COUNT doesn't force a build. Step up to a real framework + build step when the app
gains: untrusted external users, a large/growing feature set, hard first-load performance needs,
public/SEO pages, npm UI libraries, or multiple developers. The line is COMPLEXITY + UNTRUSTED
USERS, not user count. For untrusted users the real change is the SECURITY/auth architecture.

## Testing
A real-browser E2E test harness exists at `test-harness/` (Playwright via Python — no Node
needed). It drives the actual app in a real Chromium browser the way a real user would: real
login clicks, real nav clicks, real typing — no mocks, no simulations, no unit tests. See
`test-harness/README.md` for setup, how to run it, and the full registry of available
fixtures/helpers/specs (and the convention for keeping that registry current).

**Run it before the final commit+push on every change to this repo** — not optional, not only
when asked. If a change doesn't fit any existing spec, use judgment (a trivial doc-only edit
doesn't need a browser test) but default to running the harness, not skipping it.

## Communication: explain big decisions
For any significant decision (architecture, security tradeoff, tooling pick, anything non-trivial),
explain it in simple English first — WHAT and WHY — then give the technical term(s) in parentheses,
and define jargon inline. Keep it a natural parenthetical, not a lecture. Ask fewer questions; act on
routine choices, but explain the meaningful ones.

## PR Process
1. Re-read the priorities + security rules above.
2. Plan the arc: capability, minimum features to e2e-test it for real, atomic commits, waves.
3. Assess blast radius: list call sites touched + what could break; mark high-risk for double-review.
4. Implement (elegance + blast-radius rules).
5. Review the PR's code — always, not only when asked: read your full diff for correctness,
   scope creep, SSOT violations, security, and these priorities. For high-risk work (money,
   auth, data, migrations) also have an agent-review team review the diff, then fix what it finds.
6. Run the test harness (`test-harness/`, see the Testing section above) — always before the
   final commit+push, loop-fix until green — plus a real click-through of anything the harness
   doesn't cover yet.
7. Commit + push to `main` (= deploy via GitHub Pages), then verify the change live on app.aspmgmt.com.
