"""
Navigation/data-layer refactor, PR 16: validates the new login_as_real() fixture (real Supabase
signInWithPassword, publishable key only -- see helpers.py) against the same kind of coverage
test_smoke.py already gives Demo Mode, so this is proven solid BEFORE anything in a later wave
starts relying on it to replace Demo Mode entirely.

Needs test-harness/.env configured (ASP_TEST_HARNESS_EMAIL/ASP_TEST_HARNESS_PASSWORD) and the
matching admin_users row already seeded with that account's real user_id -- see README.md
"Real-auth test account setup". Skips cleanly if not configured, rather than failing the whole
suite in an environment where no one has set this up yet.
"""
import os

import pytest
from helpers import login_as_real, goto_nav, collect_console_errors, mgmt_nav_items_for

pytestmark = pytest.mark.skipif(
    not (os.environ.get("ASP_TEST_HARNESS_EMAIL") and os.environ.get("ASP_TEST_HARNESS_PASSWORD")),
    reason="real-auth test credentials not configured (test-harness/.env) -- see README.md",
)


def test_real_login_lands_on_admin_dashboard(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as_real(page)

    assert page.locator("h1").is_visible(), "no <h1> rendered after a real sign-in"
    assert not errors, f"console errors during real sign-in: {errors}"


def test_real_login_nav_sweep(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as_real(page)

    # The test-harness account is seeded with role admin_bookings -- same nav set a real
    # admin_bookings user (or the admin_bookings Demo Mode account) would see.
    for view in mgmt_nav_items_for("admin_bookings"):
        goto_nav(page, view, mobile=False)
        title = page.locator("h1")
        assert title.is_visible(), f"no <h1> rendered on view '{view}' after real sign-in"
        assert title.inner_text().strip(), f"empty page title on view '{view}' after real sign-in"

    assert not errors, f"console errors during real-auth nav sweep: {errors}"


def test_real_login_persists_across_reload(live_server, page):
    """Real sign-in -- unlike Demo Mode, which explicitly does not persist -- should survive a
    page reload, since that's the actual point of using real Supabase sessions for testing."""
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as_real(page)
    assert page.locator("h1").is_visible()

    page.reload()
    page.wait_for_selector("h1", timeout=15000)
    assert page.locator("h1").is_visible(), "real session didn't survive a reload"
    assert not errors, f"console errors after reload: {errors}"
