"""
Reusable actions for driving the real asp-bookings app in a real browser.
See README.md for the full registry — any new helper added here must also be added there.
"""
import os

# Mirrors frontend/index.html's ADMIN_USERS / ARTISTS id lists (source of truth for the roster
# lives there — index.html:761-765 and :578-585 as of this writing). Update here if the roster
# changes; there's no way to derive this list without running the app, so it's duplicated
# deliberately, not accidentally.
ADMIN_IDS = ["admin_bookings", "admin_bookkeeping", "admin_ceo"]
ARTIST_IDS = ["baruch", "benny", "moshe", "yaakov", "eli", "dovie"]

# Navigation/data-layer refactor, PR 18: Demo Mode is gone, so each of the 9 personas above is now
# a real seeded Supabase account (see README.md "Real-auth test account setup"). The
# admin_bookings account predates this batch and keeps its own password var; the other 8 share one
# password generated for this batch -- both live in test-harness/.env (gitignored), never here.
ROLE_EMAILS = {
    "admin_bookings": "test-harness@aspmgmt.com",
    "admin_bookkeeping": "test-bookkeeping@aspmgmt.com",
    "admin_ceo": "test-ceo@aspmgmt.com",
    "baruch": "test-baruch@aspmgmt.com",
    "benny": "test-benny@aspmgmt.com",
    "moshe": "test-moshetischler@aspmgmt.com",
    "yaakov": "test-yaakov@aspmgmt.com",
    "eli": "test-eli@aspmgmt.com",
    "dovie": "test-dovie@aspmgmt.com",
}


def _password_for(user_id):
    if user_id == "admin_bookings":
        return os.environ.get("ASP_TEST_HARNESS_PASSWORD")
    return os.environ.get("ASP_TEST_BATCH2_PASSWORD")

# Nav items actually visible in the mobile bottom-nav pill today (some are demoted to the
# hamburger-menu-only per earlier UI work) — see frontend/index.html's `.bn-item[data-view=...]
# {display:none}` rules for the current hide-list. Keep this in sync if that changes.
MOBILE_ADMIN_NAV = ["dashboard", "calendar", "leads", "projects", "financials"]
MOBILE_ARTIST_NAV = ["a_calendar", "a_gigs", "a_dashboard", "a_travel", "a_financials"]

MGMT_NAV_ITEMS = ["dashboard", "calendar", "leads", "artists", "travel", "projects", "pricing", "financials", "outside_bookings", "documents", "contracts", "contract_builder", "messages"]
ARTIST_NAV_ITEMS = ["a_dashboard", "a_calendar", "a_gigs", "a_travel", "a_financials", "a_projects"]

CEO_HIDDEN_NAV_VIEWS = ("outside_bookings", "documents", "contract_builder")


def mgmt_nav_items_for(user_id):
    """Mirrors index.html's mgmtNavItemsFor() -- Outside Bookings/Documents hidden from admin_ceo."""
    return [v for v in MGMT_NAV_ITEMS if not (v in CEO_HIDDEN_NAV_VIEWS and user_id == "admin_ceo")]


def dismiss_opener(page):
    """
    The splash screen (#opener, frontend/index.html) sits full-viewport for ~2.7s before
    auto-dismissing (a setTimeout + a further 900ms removal) -- under this harness's back-to-back
    browser load, backgrounded-tab timer throttling can slip that well past a naive wait, causing
    real (if intermittent) failures clicking anything on the login screen. The opener has its own
    built-in click-to-skip handler (any click on it calls its internal finish()) -- use that
    directly instead of racing its timer.
    """
    opener = page.locator('#opener')
    if opener.count():
        try:
            opener.click(timeout=2000)
        except Exception:
            pass
        opener.wait_for(state='detached', timeout=8000)


def is_admin(user_id):
    return user_id in ADMIN_IDS


def login_as_real(page, email=None, password=None):
    """
    Signs in via the REAL Supabase auth path (signInWithPassword) instead of clicking through
    Demo Mode -- uses only the publishable/anon key already shipped in the frontend
    (window.supabaseClient, asp.js:17290), never a service-role key. Requires a pre-seeded
    admin_users/artists row whose user_id already matches this account's auth.users row (the
    roster-link trigger only fires on NEW auth.users inserts, so a roster row created after the
    account exists needs its user_id set directly) -- see README.md "Real-auth test account
    setup" for how the one asp-bookings test-harness account was created.

    Reads ASP_TEST_HARNESS_EMAIL/ASP_TEST_HARNESS_PASSWORD from test-harness/.env (gitignored,
    loaded by conftest.py) if not passed explicitly -- never hardcode a real credential in a
    spec file. Call after page.goto(live_server), same as login_as().
    """
    email = email or os.environ.get("ASP_TEST_HARNESS_EMAIL")
    password = password or os.environ.get("ASP_TEST_HARNESS_PASSWORD")
    if not email or not password:
        raise RuntimeError(
            "Real-auth test credentials not configured -- set ASP_TEST_HARNESS_EMAIL / "
            "ASP_TEST_HARNESS_PASSWORD in test-harness/.env (see README.md)."
        )
    dismiss_opener(page)
    page.wait_for_function("window.supabaseClient !== undefined", timeout=10000)
    error_message = page.evaluate(
        """async ({email, password}) => {
            const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            return error ? error.message : null;
        }""",
        {"email": email, "password": password},
    )
    if error_message:
        raise RuntimeError(f"Real sign-in failed: {error_message}")
    # linkRealSessionToRoster() (asp.js) runs a Supabase query before S.user is set and the real
    # page renders, so this takes a beat longer than Demo Mode's old synchronous click-through did.
    page.wait_for_selector("h1", timeout=15000)


def login_as(page, user_id):
    """
    Signs in as one of the 9 real seeded test accounts via real Supabase auth (email/password
    looked up from ROLE_EMAILS + test-harness/.env). Replaces the old Demo Mode click-through --
    Demo Mode was removed from the app in PR 18 (navigation/data-layer refactor); this keeps the
    exact same (page, user_id) call signature so none of the ~45 existing call sites needed to
    change. See README.md "Real-auth test account setup".
    """
    email = ROLE_EMAILS.get(user_id)
    if not email:
        raise ValueError(f"no real-auth test account configured for user_id={user_id!r}")
    login_as_real(page, email=email, password=_password_for(user_id))


def goto_nav(page, view_key, mobile=False):
    """
    Clicks the real nav control for `view_key` — the desktop rail/top-tabs, or the mobile
    bottom-nav pill if `mobile=True`. Does not touch location.hash directly.
    """
    if mobile:
        page.locator(f'.bn-item[data-action="nav"][data-view="{view_key}"]').click()
    else:
        # Admin: sidebar rail. Artist: top tab bar. Both use the same data-action/data-view
        # convention, just a different container — try the one that's actually visible.
        rail = page.locator(f'.rail-link[data-action="nav"][data-view="{view_key}"]')
        tab = page.locator(f'.artist-top-tabs .tab[data-action="nav"][data-view="{view_key}"]')
        if rail.count() and rail.first.is_visible():
            rail.first.click()
        else:
            tab.first.click()
    # render() is synchronous, but the page-slide transition (translateX over .26s) can
    # transiently widen scrollWidth mid-animation -- 350ms clears it with margin (confirmed by
    # sampling scrollWidth every 50ms: overflow present 0-200ms, gone by 250ms).
    page.wait_for_timeout(350)


def collect_console_errors(page):
    """
    Attach a console listener and return a list you can assert against after driving the page.
    Call this right after page creation, before any navigation, to catch everything.
    """
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    return errors


def has_no_horizontal_overflow(page):
    """
    Real assertion for the app's standing "no sideways scrolling, ever" rule.
    Returns True/False rather than asserting directly, so callers can report the actual
    scrollWidth/innerWidth values on failure.
    """
    return page.evaluate(
        "document.documentElement.scrollWidth <= window.innerWidth + 1"  # +1: sub-pixel rounding
    )
