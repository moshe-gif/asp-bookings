"""
2026-10-09 audit W2-4:
- 4.2 a reload / deep link keeps the page you were on (sign-in used to force the dashboard), and a
  URL for a page your role can't open lands on your home page instead of a blank screen.
- 4.3 a failed account lookup (outage) shows "Couldn't reach ASP Bookings / Try again" instead of
  "No account set up yet", and Try again recovers.
"""
import re

from helpers import login_as, goto_nav, collect_console_errors

ADMIN_LOOKUP = re.compile(r"/rest/v1/admin_users")


def _title(page):
    page.wait_for_selector("h1", timeout=20000)
    return page.locator("h1").first.inner_text().strip()


def test_reload_keeps_the_current_page(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "financials")
    before = _title(page)
    assert "#/financials" in page.url, page.url
    page.reload()
    page.wait_for_function("() => document.querySelector('h1') && location.hash.includes('financials')", timeout=20000)
    assert _title(page) == before, f"reload changed the page from {before!r}"
    assert not errors, f"console errors: {errors}"


def test_cross_role_url_lands_on_home_not_blank(live_server, page):
    page.goto(live_server)
    login_as(page, "benny")
    page.evaluate("() => { location.hash = '#/financials'; }")  # an admin-only page
    page.wait_for_timeout(400)
    assert "a_dashboard" in page.url, page.url
    assert page.locator("main, #app").first.inner_text().strip(), "blank page"


def test_account_lookup_outage_offers_retry(live_server, browser):
    # Service workers blocked: the app's pass-through worker relays every fetch, and Playwright
    # can't intercept requests a service worker makes.
    ctx = browser.new_context(service_workers="block")
    page = ctx.new_page()
    page.goto(live_server)
    page.route(ADMIN_LOOKUP, lambda route: route.abort())
    try:
        login_as(page, "admin_bookings")
    except Exception:
        pass  # login_as waits for the dashboard, which can't load during the simulated outage
    page.get_by_text("Couldn't reach ASP Bookings").wait_for(timeout=15000)
    assert page.get_by_text("No account set up yet").count() == 0
    page.unroute(ADMIN_LOOKUP)
    page.locator('[data-action="retry-roster-link"]').click()
    page.wait_for_selector("h1", timeout=20000)
    ctx.close()
