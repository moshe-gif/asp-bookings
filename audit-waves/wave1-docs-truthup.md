Working directory: /Users/sonnenscheinfam/asp-bookings

Read AUDIT.md and AUDIT.csv in this repo first — I already ran a full codebase audit and this is
Wave 1 of the follow-up work: findings #6, #7, #9, #10, #11, all "For Sure, Right Now" tier
(docs-only, zero code-behavior risk). Do all five in one session, one commit.

## #6 — CLAUDE.md deploy instructions are wrong
CLAUDE.md's "Deploy discipline" section says deploy is "SFTP a single file up
(`deploy/deploy-index.js` / `deploy-proxy.js`)." That's not how this repo actually deploys — it's
GitHub Actions → GitHub Pages on push to `main` (see `.github/workflows/pages.yml`, which
uploads `frontend/` as the Pages artifact). Confirm: `deploy/deploy-index.js` and
`deploy/deploy-proxy.js` are untouched since the initial commit (`git log --oneline -- deploy/`),
require `ssh2-sftp-client` which isn't installed (no `package.json` exists anywhere in this
repo), and read `DEPLOY_HOST`/`DEPLOY_USER`/`DEPLOY_PASS` from `.env` which aren't set for this
project. They're app-starter-kit template leftovers, never adapted for asp-bookings' actual
(different) deploy mechanism.

Fix: rewrite CLAUDE.md's deploy section for what's actually true here — static push-to-deploy via
GitHub Pages, no SFTP, no server, no `deploy/` scripts in the live path for this project. Don't
delete `deploy/*.js` (they may still be a valid template reference for other app-starter-kit
projects that DO deploy via SFTP) — just make sure CLAUDE.md, *as read in this repo*, describes
reality. A short note near the top of that section along the lines of "this project deploys via
GitHub Pages (see .github/workflows/pages.yml) — the SFTP scripts below are template scaffolding
not used here" is enough; don't rewrite the whole doc.

## #7 — Supabase auth undocumented
The app's real, live auth (magic-link + passkey sign-in) is Supabase — see
`frontend/index.html`'s `/* ============ REAL AUTH (Supabase) ============ */` section (~line
1078) and the "Sign in with Passkey" / "Sign in with email" buttons on the login screen.
INTEGRATIONS.md only documents a Google ID-token pattern for auth (§4) and doesn't mention
Supabase at all; SETUP.md's "accounts you need" list (§0) also omits it.

Fix: add a short, accurate section to INTEGRATIONS.md documenting Supabase as the real auth
provider for this app (what it does — magic link + passkey, where the client/session code lives
in index.html, that RLS/schema work already exists in `supabase/migrations/` — see #11 below).
Add Supabase to SETUP.md's account list with a one-line note on what it's for. Keep it factual
and short — this is filling a gap, not writing a tutorial.

## #9 — proxy.js points at the wrong reference implementation
`backend/proxy.js`'s `verifyIdToken()` TODO comment says "Reference implementation: see the
Firebase ID-token verifier pattern" — but the real IdP for this app is Supabase, not Firebase.
Fix: update the comment to reference Supabase's JWT verification instead (Supabase issues
standard JWTs signed with the project's JWT secret / or verifiable via its JWKS endpoint,
depending on which auth flow — check current Supabase docs for the exact current recommended
verification approach before writing the comment, don't guess). One-line/one-paragraph comment
fix, not an implementation.

## #10 — .env.example missing Supabase vars
`.env` (the real, gitignored file) has Supabase vars that `.env.example` doesn't mention. Check
what's actually in `.env` (just the variable NAMES, never echo/commit the real values) and add
the matching placeholder entries to `.env.example` under a "Supabase" heading, consistent with
the file's existing style (see how the other sections there are formatted).

## #11 — supabase/migrations/ status undocumented
`supabase/migrations/0001_initial_schema.sql` and `0002_auth_linking.sql` describe a real,
well-designed schema (RLS policies, artists/admin_users tables matching the app's actual
ARTISTS/ADMIN_USERS shape) that is NOT currently live — the app runs entirely on localStorage
today (confirm: `frontend/index.html` line ~944 already has a comment saying Supabase is "not
yet used for data — auth only so far"). The migrations also describe a `project_types`/
stage-pipeline table set for a feature that was since REMOVED from the live app (see the "Projects
no longer have a type/stage-pipeline concept" comment near `frontend/index.html:600`) — so the
schema has already drifted from the app in a second way too.

Fix: add a short header comment to the top of both migration files (or a single new
`supabase/migrations/README.md`, your call on whichever is more idiomatic and won't get skipped
by a future skim-reader) stating: (a) not yet applied/live, this is forward-looking schema design
for the eventual real-backend migration, (b) the artists/admin_users tables are a good match for
the current app and worth reusing as-is when that migration happens, (c) the project_types tables
describe a feature that no longer exists in the app and should be dropped or reconsidered when
this schema is actually adopted, not applied as-is.

## When done
Single commit covering all five doc fixes (they're small and related — one PR-sized change, per
CLAUDE.md's own "atomic commits, tightly-scoped PRs" guidance). Push per the standing workflow
for this repo. Report back a short summary of exactly what changed in each file.
