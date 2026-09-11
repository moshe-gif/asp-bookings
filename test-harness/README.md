# Test Harness — real-browser E2E for asp-bookings

This is the single source of truth for how to test this app for real: a real Chromium browser
(via Playwright's Python bindings), driving the actual `frontend/index.html` served over real
`http://localhost`, clicking through the real UI the way a real user would. No mocks, no
simulations, no unit tests — if you want that, this isn't it (and per `CLAUDE.md`, that's
deliberate for this project).

Why Python and not Node/Playwright-JS: this dev machine has no `node`/`npm`/`brew` installed.
`python3`/`pip3`/`venv` all work. Playwright's Python bindings are the exact same underlying
browser-automation engine as the JS version — this was a tooling choice, not a capability
tradeoff. See `AUDIT.md` finding #6 for the related discovery that `deploy/`'s Node-based scripts
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

## Registry: fixtures & helpers (`conftest.py`, `helpers.py`)

Anyone adding a new helper or fixture **must add a row here in the same commit** — this table is
the contract for what's available; if it's not listed here, assume it doesn't exist yet rather
than grepping the source to check.

| Name | Where | Purpose |
|------|-------|---------|
| `live_server` | `conftest.py` | Session-scoped fixture. Serves `frontend/` over real `http://localhost:8791`. Auto-starts/stops. |
| `page` | pytest-playwright (built-in) | Fresh browser page per test, standard fixture, not ours. |
| `dismiss_opener(page)` | `helpers.py` | Clicks through the splash screen instead of waiting on its auto-dismiss timer (which can slip under this harness's back-to-back browser load). Called automatically by `login_as` — most callers never need this directly. |
| `login_as(page, user_id)` | `helpers.py` | Drives the real login UI (dismisses the splash screen, clicks "Sign In (Demo Mode)" → the matching account row). Not a state shortcut. |
| `goto_nav(page, view_key, mobile=False)` | `helpers.py` | Clicks the real nav control for a view — desktop rail/top-tabs, or the mobile bottom-nav pill if `mobile=True`. |
| `collect_console_errors(page)` | `helpers.py` | Call right after page creation; returns a list that fills up with any console errors/page errors as you drive the page. |
| `has_no_horizontal_overflow(page)` | `helpers.py` | Real check for the app's "no sideways scrolling, ever" rule (`scrollWidth <= innerWidth`). Returns bool, not an assertion, so callers can report actual values on failure. |
| `ADMIN_IDS`, `ARTIST_IDS` | `helpers.py` | The demo-mode account roster. Mirrors `frontend/index.html`'s `ADMIN_USERS`/`ARTISTS` — **update here if the roster changes**, there's no way to derive it without running the app. |
| `MGMT_NAV_ITEMS`, `ARTIST_NAV_ITEMS` | `helpers.py` | All nav views per role (desktop). Mirrors `index.html`'s same-named arrays. |
| `MOBILE_ADMIN_NAV`, `MOBILE_ARTIST_NAV` | `helpers.py` | Only the views actually visible in the mobile bottom-nav pill today (some are hamburger-menu-only) — keep in sync with `index.html`'s `.bn-item[data-view=...]{display:none}` rules. |

## Registry: spec files

| File | Covers |
|------|--------|
| `test_smoke.py` | Every admin role + every artist logs in for real, clicks every nav item, asserts no console errors and real content rendered. The baseline "is the app fundamentally broken" check. |
| `test_mobile.py` | Same sweep at a real 390×844 viewport (`page.set_viewport_size` — no floor-size bug, unlike the `resize_window` MCP tool in interactive sessions), asserting no horizontal overflow anywhere. |
| `test_core_flows.py` | A few real write-flows: create a lead, add a sticky-note board item, assign a project task to a person — each asserts the created state actually appears, not just "didn't crash." |
| `test_documents.py` | General Documents builder (own nav tab): brand-swap between ASP and SING Entertainment letterhead via the Outside Bookings entry point, and the "On behalf of {artist}" attribution line when a document's subject is one of ASP's own roster artists. |
| `test_edit_event.py` | The "Edit details" button on an event sheet: creates a fresh lead, edits its core fields (client name, venue, price) after creation, and asserts commission/payout recompute correctly (not just the raw price). |
| `test_modularization.py` | Parent-app Phase 1a: `window.Workspaces.asp` is really registered via the mount/unmount contract (not just working-when-inlined), and the post-extraction `APP_VERSION` bump renders — the acceptance check that the ASP/shell/VOX seam is real. |

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
  diffing; the real (non-demo) Supabase magic-link/passkey auth path isn't covered — Demo Mode
  accounts are the only sensible target for an automated "act like a real user" loop.
