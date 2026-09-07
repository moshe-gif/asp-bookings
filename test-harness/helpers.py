"""
Reusable actions for driving the real asp-bookings app in a real browser.
See README.md for the full registry — any new helper added here must also be added there.
"""

# Mirrors frontend/index.html's ADMIN_USERS / ARTISTS id lists (source of truth for the roster
# lives there — index.html:761-765 and :578-585 as of this writing). Update here if the roster
# changes; there's no way to derive this list without running the app, so it's duplicated
# deliberately, not accidentally.
ADMIN_IDS = ["admin_bookings", "admin_bookkeeping", "admin_ceo"]
ARTIST_IDS = ["baruch", "benny", "moshe", "yaakov", "eli", "dovie"]

# Nav items actually visible in the mobile bottom-nav pill today (some are demoted to the
# hamburger-menu-only per earlier UI work) — see frontend/index.html's `.bn-item[data-view=...]
# {display:none}` rules for the current hide-list. Keep this in sync if that changes.
MOBILE_ADMIN_NAV = ["dashboard", "calendar", "leads", "projects", "financials"]
MOBILE_ARTIST_NAV = ["a_calendar", "a_gigs", "a_dashboard", "a_travel", "a_financials"]

MGMT_NAV_ITEMS = ["dashboard", "calendar", "leads", "artists", "travel", "projects", "pricing", "financials", "messages"]
ARTIST_NAV_ITEMS = ["a_dashboard", "a_calendar", "a_gigs", "a_travel", "a_financials", "a_projects"]


def login_as(page, user_id):
    """
    Drives the real login UI: click "Sign In (Demo Mode)", then the matching account row.
    Not a JS/state shortcut — this is what a real user actually clicks through, every time
    (demo-mode login isn't persisted to localStorage, confirmed against the app's own code).
    Lands on that role's dashboard.
    """
    page.get_by_text("Sign In (Demo Mode)").click()
    page.locator(f'.chooser-row[data-user="{user_id}"]').click()
    # Not ".topbar, .artist-top-tabs": artist views render a SECOND, nested .topbar inside
    # .artist-top-tabs (hidden on mobile via display:none), and a multi-match CSS selector waits
    # on whichever element it resolves first in DOM order -- which can be the hidden one,
    # timing out forever on mobile viewports. <h1> is unique (exactly one in the whole app) and
    # always populated the instant a real page renders, for either role, any viewport.
    page.wait_for_selector("h1")


def is_admin(user_id):
    return user_id in ADMIN_IDS


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
