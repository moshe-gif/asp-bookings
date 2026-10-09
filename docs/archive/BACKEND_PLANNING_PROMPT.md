Working directory: /Users/sonnenscheinfam/asp-bookings

Moshe wants a real backend for this app: "a very tight and sophisticated backend that will be
able to help our scaling operations." This is a big, consequential architecture decision — before
writing any code, present a real plan (use plan mode) and get his sign-off, the same way the test
harness and the Outside Bookings document builder were planned in the session that produced this
prompt.

## Start here: ask him what "scaling" actually means

That word is doing a lot of work and is genuinely ambiguous — the right architecture differs a lot
depending on the answer. Ask directly before assuming: more artists/staff using it concurrently?
Real-time sync so two office logins see the same data live? Offline support? More third-party
integrations (email, payments, calendar) coming online? Don't guess — this shapes everything below.

## The real situation today (read this before proposing anything)

- **The entire app is client-side mock data.** Every collection (`ARTISTS`, `PROJECTS`,
  `S.events`, `OUTSIDE_BOOKINGS`, settings, everything) lives in each browser's own `localStorage`
  — nothing is shared across devices or logins. Confirm this yourself by reading
  `frontend/index.html`'s data-layer functions (search for `LS_KEY` — there are ~10 of them).
- **This has already caused real problems.** Earlier this session, an iPhone PWA install showed
  stale "demo" data because it has fully isolated `localStorage` from any browser tab — nothing to
  do with a bug, just the architecture. Read `AUDIT.md` in full (already in the repo) — finding
  category D covers this and related gaps in detail; it's the single biggest architectural issue
  in the codebase today.
- **Real auth already exists and is live** — not mocked. `frontend/index.html`'s
  `/* ============ REAL AUTH (Supabase) ============ */` section (~line 1078) does real
  Supabase magic-link + passkey sign-in, gated on `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` being
  present in `.env`. The "Sign In (Demo Mode)" account chooser is a *separate*, deliberately-kept
  mock path for previewing any role without real credentials — don't remove it without asking;
  it's used constantly for internal testing (including by the real-browser test harness, see
  below).
- **A real, well-designed schema already exists, unused.** `supabase/migrations/0001_initial_schema.sql`
  and `0002_auth_linking.sql` define `artists`/`admin_users` tables that already match this app's
  actual `ARTISTS`/`ADMIN_USERS` shape, with RLS policies and a trigger that links a new
  `auth.users` row to an existing roster row by email on first real sign-in. This is a real head
  start — read it before designing a schema from scratch. One known issue in it: it also has a
  `project_types`/stage-pipeline table set for a project-types feature that was *removed* from the
  live app in this same session (see git log around "project board" / "sticky notes" commits) —
  decide whether to drop that from the schema or repurpose it, don't apply it as-is.
- **`backend/proxy.js` exists but is inert.** A generic zero-dependency Node template — real
  security patterns are sketched (CORS lock, rate limiting, AES-256-GCM state encryption, ID-token
  gating) but `ADMIN_EMAILS` is still a literal placeholder and `verifyIdToken()` unconditionally
  fails. It has never been deployed for this project and nothing calls it today (confirmed: zero
  `fetch`/`/api/` references anywhere in `frontend/index.html`). `deploy/deploy-proxy.js` (SFTP,
  Node) is also unused — this repo actually ships via GitHub Actions → Pages
  (`.github/workflows/pages.yml`), not SFTP; see `AUDIT.md` finding #6.
- **The real question to resolve in the plan**: does most CRUD go **direct from the browser to
  Supabase** (using RLS policies for security — the modern, low-maintenance Supabase-native
  pattern, no custom API needed for ordinary reads/writes), with `backend/proxy.js` reserved only
  for the handful of things that genuinely need a secret held server-side (a real Anthropic key
  for the "AI Editor" placeholder already built into the Outside Bookings document builder; a
  future Stripe secret key; etc.) — or does he want everything behind a custom API regardless?
  Both are legitimate; this is a real architectural fork to present, not something to decide alone.

## Constraints to respect

- `frontend/` stays a single HTML file, no build step, no bundler — that's a deliberate,
  documented choice in `CLAUDE.md`, not something this work should change. A Supabase client can
  be loaded via a plain `<script>` tag (it already is, for auth) — no build step required for
  this.
- Read `CLAUDE.md` in full first — Engineering Priorities, the Security section (non-negotiable:
  secrets server-side only, RLS/auth gating, never trust the client), and the Testing section.
- **Run the real-browser test harness (`test-harness/`) before any commit+push** — this is now a
  standing rule in `CLAUDE.md`, not optional. Migrating data off `localStorage` is exactly the
  kind of change most likely to quietly break something the harness would catch (a role that can
  no longer see its own data, a flow that silently no-ops). Expect to add new specs as real data
  flows come online — `test-harness/README.md` has the registry and the convention for keeping it
  current.
- Given the size of this, plan it in waves (per `CLAUDE.md`'s own "split sequential work into
  ordered waves" rule) rather than one big-bang migration — e.g. read-path first with a fallback,
  or one collection at a time, your call once you understand what he actually needs from
  "scaling."

## What to do

1. Ask the scaling-scope question above.
2. Read `AUDIT.md`, both `supabase/migrations/*.sql` files, `CLAUDE.md`, `INTEGRATIONS.md`,
   `SETUP.md`, and the auth section of `frontend/index.html` (~1078+).
3. Enter plan mode. Present the direct-to-Supabase-vs-custom-API fork explicitly, propose a wave
   breakdown, and get his sign-off before writing code.
