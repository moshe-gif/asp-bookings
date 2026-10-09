# Test Harness — real-browser E2E for asp-bookings

This is the single source of truth for how to test this app for real: a real Chromium browser
(via Playwright's Python bindings), driving the actual `frontend/index.html` served over real
`http://localhost`, clicking through the real UI the way a real user would. No mocks, no
simulations, no unit tests — if you want that, this isn't it (and per `CLAUDE.md`, that's
deliberate for this project).

Why Python and not Node/Playwright-JS: this dev machine has no `node`/`npm`/`brew` installed.
`python3`/`pip3`/`venv` all work. Playwright's Python bindings are the exact same underlying
browser-automation engine as the JS version — this was a tooling choice, not a capability
tradeoff. See `docs/archive/AUDIT.md` finding #6 for the related discovery that `deploy/`'s Node-based scripts
have sat unused for the same reason.

This only adds a dependency to `test-harness/` itself (its own venv) — `frontend/` stays exactly
as it is: zero-dependency, no build step, single HTML file.

## One-time setup

```bash
cd test-harness
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium   # downloads a real Chromium binary, ~250MB, one time
```

## Running

```bash
cd test-harness && source .venv/bin/activate
pytest                      # everything
pytest test_smoke.py        # just one file
pytest -k admin_ceo         # just tests matching a keyword
pytest --headed             # watch it click through in a real visible window
```

On any failure, a screenshot and a Playwright trace are saved under `test-results/` automatically
(`pytest.ini` sets `--screenshot=only-on-failure --tracing=retain-on-failure`). Open a trace with:

```bash
playwright show-trace test-results/<failing-test-folder>/trace.zip
```

That gives a full timeline replay of the failing run — DOM snapshots, network, console — usually
enough to diagnose a failure without re-running anything interactively.

## Real-auth test account setup

Navigation/data-layer refactor, PR 18: Demo Mode is gone from the app entirely (flip-the-switch
removal — no kill flag left behind). `login_as(page, user_id)` now signs in via real Supabase auth
for all 9 roles (`admin_bookings`, `admin_bookkeeping`, `admin_ceo`, `baruch`, `benny`, `moshe`,
`yaakov`, `eli`, `dovie`) — it's a thin wrapper around `login_as_real()` that looks the account's
email up in `helpers.py`'s `ROLE_EMAILS` and its password up in `test-harness/.env`. Each needs a
dedicated Supabase account, created once, outside this repo:

1. In the Supabase Dashboard → Authentication → Users → **Add user** → **Create new user**, use a
   test-only email (e.g. `test-baruch@aspmgmt.com` — never a real artist's/admin's real email) and
   a strong generated password, with **Auto confirm user** checked. Note the UID it creates.
2. Insert the matching roster row **with that UID already set** — the roster-link DB trigger
   (`link_new_user_to_roster()`, migration `0002_auth_linking.sql`) only fires on a *new*
   `auth.users` insert, so a roster row created afterward needs its `user_id` set directly, not
   left for the trigger to backfill:
   ```sql
   -- admins:
   insert into admin_users (name, email, role, initials, user_id)
   values ('Test Harness', 'test-harness@aspmgmt.com', 'admin_bookings', 'TH', '<uid-from-step-1>')
   on conflict (email) do update set user_id = excluded.user_id;

   -- artists: set legacy_id to the matching short id (see below for why) --
   insert into artists (name, slot, initials, email, role, legacy_id, user_id)
   values ('Baruch Levine', 1, 'BL', 'test-baruch@aspmgmt.com', 'Singer', 'baruch', '<uid>')
   on conflict (email) do update set user_id = excluded.user_id, legacy_id = excluded.legacy_id;
   ```
3. Add the password to `test-harness/.env` (gitignored — never commit this file). The original
   `admin_bookings` account keeps its own var; every account added since shares one:
   ```
   ASP_TEST_HARNESS_EMAIL=test-harness@aspmgmt.com
   ASP_TEST_HARNESS_PASSWORD=<password for test-harness@aspmgmt.com>
   ASP_TEST_BATCH2_PASSWORD=<shared password for every other test-* account>
   ```
4. Add the email to `ROLE_EMAILS` in `helpers.py` if it's a new `user_id` (the 9 above are already
   wired up).

**Why `artists.legacy_id` (migration `0029_artists_legacy_id.sql`):** `artists.id` is a real
Postgres uuid, but every seeded/imported gig (`event.artistId`, all 215 real imported events, all
demo fixtures) keys to the app's original short string ids (`'baruch'`, `'benny'`, ...). A freshly
created real artist's uuid matches zero existing events — without a bridge, My Gigs/Calendar/
Financials would render completely empty for every real artist, test or production.
`artists.legacy_id` maps a real artist row back to the matching legacy string id;
`linkRealSessionToRoster()` (`asp.js`) uses it to set `S.user` to the legacy id instead of the raw
uuid when one exists — same trick the admin branch already used (`S.user = adminRow.role`, not the
admin's own uuid) for the identical reason. A brand-new real artist with no `legacy_id` falls back
to their own uuid, same as before this fix.

`login_as_real()` signs in with `supabaseClient.auth.signInWithPassword()` using only the
publishable/anon key already shipped in the frontend — no service-role key is ever used by this
harness. `test_real_auth.py` skips cleanly if `.env` isn't present, rather than failing the whole
suite in an environment where this hasn't been set up (every other spec now requires it, since
Demo Mode no longer exists to fall back on).

**Found while setting this up (now fixed, migration `0028_grant_authenticated_table_access.sql`):**
every table in `public` was missing its base Postgres `GRANT ... TO authenticated` — a real signed-in
session got `permission denied for table admin_users` on a plain select, which is a privilege-layer
error, not an RLS one (Postgres checks GRANTs before it ever evaluates a row-level security policy).
This silently blocked **every** real (non-service-role, non-Demo-Mode) session from reading any
data at all, including a real admin's own sign-in — not specific to this test account. If a fresh
Supabase project is ever stood up for staging, re-apply migration `0028` (or confirm the project's
default grants already cover `authenticated`) before assuming real auth works end to end.

## Registry: fixtures & helpers (`conftest.py`, `helpers.py`)

Anyone adding a new helper or fixture **must add a row here in the same commit** — this table is
the contract for what's available; if it's not listed here, assume it doesn't exist yet rather
than grepping the source to check.

| Name | Where | Purpose |
|------|-------|---------|
| `live_server` | `conftest.py` | Session-scoped fixture. Serves `frontend/` over real `http://localhost:8791`. Auto-starts/stops. |
| `page` | pytest-playwright (built-in) | Fresh browser page per test, standard fixture, not ours. |
| `dismiss_opener(page)` | `helpers.py` | Clicks through the splash screen instead of waiting on its auto-dismiss timer (which can slip under this harness's back-to-back browser load). Called automatically by `login_as` — most callers never need this directly. |
| `login_as(page, user_id)` | `helpers.py` | Navigation/data-layer refactor PR 18. Signs in as one of the 9 real seeded test accounts (`ROLE_EMAILS`) via real Supabase auth — a thin wrapper around `login_as_real()`. Demo Mode is gone from the app; this keeps the exact same `(page, user_id)` signature the ~45 existing call sites already used. |
| `login_as_real(page, email=None, password=None)` | `helpers.py` | Navigation/data-layer refactor PR 16. Signs in via the REAL Supabase auth path (`signInWithPassword`, publishable key only — no service-role key). Reads `ASP_TEST_HARNESS_EMAIL`/`ASP_TEST_HARNESS_PASSWORD` from `test-harness/.env` (gitignored) if `email`/`password` aren't passed explicitly — `login_as()` always passes them explicitly, looked up per-role. See "Real-auth test account setup" below. |
| `goto_nav(page, view_key, mobile=False)` | `helpers.py` | Clicks the real nav control for a view — desktop rail/top-tabs, or the mobile bottom-nav pill if `mobile=True`. Views removed from the menu (`URL_ONLY_VIEWS`: External Events, Documents — 2026-10-09) are opened by URL hash instead, since no menu control exists for them. |
| `collect_console_errors(page)` | `helpers.py` | Call right after page creation; returns a list that fills up with any console errors/page errors as you drive the page. |
| `has_no_horizontal_overflow(page)` | `helpers.py` | Real check for the app's "no sideways scrolling, ever" rule (`scrollWidth <= innerWidth`). Returns bool, not an assertion, so callers can report actual values on failure. |
| `ADMIN_IDS`, `ARTIST_IDS` | `helpers.py` | The 9 real test-account roles. Mirrors `frontend/workspaces/asp.js`'s `ADMIN_USERS`/`ARTISTS` role set — **update here (and `ROLE_EMAILS`, and create the matching Supabase account) if the roster changes**, there's no way to derive it without running the app. |
| `ROLE_EMAILS` | `helpers.py` | Maps each `user_id` to its real test account's email. See "Real-auth test account setup" above. |
| `MGMT_NAV_ITEMS`, `ARTIST_NAV_ITEMS` | `helpers.py` | All nav views per role (desktop). Mirrors `index.html`'s same-named arrays. |
| `MOBILE_ADMIN_NAV`, `MOBILE_ARTIST_NAV` | `helpers.py` | Only the views actually visible in the mobile bottom-nav pill today (some are hamburger-menu-only) — keep in sync with `index.html`'s `.bn-item[data-view=...]{display:none}` rules. |

## Registry: spec files

| File | Covers |
|------|--------|
| `test_contract_builder.py` | Contract Builder (Standard / Comedian / Multi-Performer / Creative templates): payee-profile autofill, boilerplate, line items + add-ons, tiered cancellation, live fee/deposit math, overtime/travel/discount rendering, reload persistence, schema migration. Plus the 2026-10-09 money fixes: approval is voided by any later change to client-facing terms (incl. Refresh from Lead), deposit % "0" uses the flat $ amount, multi-performer totals include every artist, Refresh from Lead keeps the contract's fee. |
| `test_smoke.py` | Every admin role + every artist logs in for real, clicks every nav item, asserts no console errors and real content rendered. The baseline "is the app fundamentally broken" check. Also: External Events/Documents are absent from both menus for every admin, and the login screen hides the passkey button (email becomes primary) in a browser without WebAuthn. |
| `test_mobile.py` | Same sweep at a real 390×844 viewport (`page.set_viewport_size` — no floor-size bug, unlike the `resize_window` MCP tool in interactive sessions), asserting no horizontal overflow anywhere. |
| `test_core_flows.py` | A few real write-flows: create a lead, add a sticky-note board item, assign a project task to a person — each asserts the created state actually appears, not just "didn't crash." |
| `test_documents.py` | General Documents builder (own nav tab): brand-swap between ASP and SING Entertainment letterhead via the Outside Bookings entry point, and the "On behalf of {artist}" attribution line when a document's subject is one of ASP's own roster artists. |
| `test_edit_event.py` | The "Edit details" button on an event sheet: creates a fresh lead, edits its core fields (client name, venue, price) after creation, and asserts commission/payout recompute correctly (not just the raw price). |
| `test_modularization.py` | Parent-app Phase 1a: `window.Workspaces.asp` is really registered via the mount/unmount contract (not just working-when-inlined), and the post-extraction `APP_VERSION` bump renders — the acceptance check that the ASP/shell/VOX seam is real. |
| `test_ops_automation.py` | ASP bookings operations automation project (2026-09-22/23): External Events (event name + a reminder survive a reload), multi-artist leads (roster on event detail, Multi-Performer / Package Agreement contract pre-fill), the Rivky travel request Send button gated on her email being configured in Settings, and the Zelle QR fields present on the payee profile form. |
| `test_wedding_band.py` | The wedding-only "Band" section (band name + size): hidden until Event Type is set to Wedding in both New Lead and Edit Details, saved onto the event, and shown on its detail sheet — including switching an existing non-Wedding lead into Wedding via Edit Details. |
| `test_booking_state_machine.py` | Durable booking record architecture PR 6: the new "Verify Deposit & Confirm (audited)" button exists alongside (not instead of) the original "Mark Booking Fee Received" button; submitting the verification modal with an empty note is blocked; submitting with a note runs the real existing booking-confirmation flow and writes a structured "Deposit verified (...)" entry to the activity log. |
| `test_event_store.py` | Navigation/data-layer refactor PR 11: the new `updateEvent()` primitive (proven against `mark-event-reviewed`) still behaves like the old direct-mutate-then-save code for the normal case, and — using two real pages sharing one browser context/localStorage — surfaces a conflict toast instead of silently clobbering a concurrent write from a second tab. |
| `test_financials_payout_consistency.py` | Navigation/data-layer refactor PR 12: reproduces the confirmed bug where the Financials page's "All Jobs" and "Artist Payouts — Gig Breakdown" tables showed two different payout numbers for the same event once it had a post-signing charge (one read the stored, possibly-stale `ev.balance`; the other already derived `zelleBalance(e)` live) — now both read the same derived value and agree. |
| `test_general_projects.py` | Navigation/data-layer refactor PR 14: a plain "New Project" no longer requires picking an artist (only the Recording Day batch flow still does) — creates one via the explicit "None" tile and confirms it renders correctly on both the project detail page and the "All Projects" board (the exact code paths that used to assume a non-null artist). |
| `test_artist_fee_privacy.py` | Navigation/data-layer refactor PR 15: an artist's own session never sees the full client package price — My Gigs shows a relabeled "Your Fee" column (not "Price"), and the event detail sheet's "Price Breakdown" hides "Performance Fee"/"Total charged to client" for a non-admin viewer, showing only their own payout line. |
| `test_real_auth.py` | Navigation/data-layer refactor PR 16: validates `login_as_real()` against the same coverage `test_smoke.py` gives Demo Mode — lands on the real admin dashboard, sweeps every nav item, and confirms the session survives a reload (unlike Demo Mode, which deliberately doesn't persist). Skips cleanly if `test-harness/.env` isn't configured. |
| `test_signup_gate.py` | Navigation/data-layer refactor PR 17: a real, unconfigured email submitted via "Sign in with email" is rejected with a clear message ("isn't set up yet") and never gets a sign-in link sent — `shouldCreateUser:false` closes the open-signup hole where Supabase used to mint a real `auth.users` row for any email typed in. Uses a real Supabase call (no `.env`/dedicated account needed, since it's deliberately testing an email that shouldn't exist anywhere). |
| `test_passkey.py` | Real passkey round trip via Chromium's virtual authenticator: add a passkey in Settings, sign out, sign back in with only the passkey, then remove it through Settings' Remove button. Served from the real origin `https://app.aspmgmt.com` (requests answered from local `frontend/`) because passkeys are bound to Supabase's `webauthn_rp_id` = `app.aspmgmt.com` and can't run on localhost. Uses the `test-harness@aspmgmt.com` account; leaves its passkey count unchanged. |

## Conventions for updating this harness

- **New helper or fixture → add it to the registry table above, same commit.** This doc is only
  useful if it's never stale.
- **Prefer real clicks over state shortcuts.** The whole point is simulating a real user; don't
  reach for `page.evaluate("S.user = ...")`-style shortcuts even though the app's own console
  supports them — that's a different (faster, less faithful) tool for a different job (ad hoc
  interactive debugging), not this harness.
- **New spec files go through `login_as`/`goto_nav`/the shared fixtures, not ad hoc selectors
  duplicating what those already do.** If a new flow needs a selector pattern that doesn't exist
  yet, add it as a helper (with a registry row), not inline in the test.
- **A transient layout assertion failing right after a nav click is often the page-slide
  animation, not a real bug** — `goto_nav`'s 350ms settle wait already accounts for this
  (confirmed by sampling `scrollWidth` during the transition — see the git history around this
  file's creation for the measurement). If you hit a similar timing-looking failure elsewhere,
  measure before assuming it's a real regression.
- **Known deliberate gaps** (see the plan this harness was built from, and ask before expanding
  scope into these): no CI integration yet (runs locally only); no visual regression/screenshot
  diffing; every spec signs in via real password auth (`signInWithPassword`) — the magic-link and
  passkey sign-in paths real users actually use are covered only by `test_signup_gate.py`'s
  unknown-email check, not end-to-end for a real account.
