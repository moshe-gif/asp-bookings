"""
Phase 0: the baseline "is the app fundamentally broken" check.

Real login as every demo-mode role, real clicks through every one of that role's nav items,
asserting no console errors and that real page content rendered at each stop. This replaces the
ad hoc smoke-test JS snippets that used to get hand-written fresh each session.
"""
import pytest
from helpers import (
    ADMIN_IDS, ARTIST_IDS, MGMT_NAV_ITEMS, ARTIST_NAV_ITEMS,
    login_as, goto_nav, collect_console_errors,
)


@pytest.mark.parametrize("user_id", ADMIN_IDS)
def test_admin_nav_sweep(live_server, page, user_id):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, user_id)

    for view in MGMT_NAV_ITEMS:
        goto_nav(page, view, mobile=False)
        title = page.locator("h1")
        assert title.is_visible(), f"[{user_id}] no <h1> rendered on view '{view}'"
        assert title.inner_text().strip(), f"[{user_id}] empty page title on view '{view}'"

    assert not errors, f"[{user_id}] console errors during nav sweep: {errors}"


@pytest.mark.parametrize("user_id", ARTIST_IDS)
def test_artist_nav_sweep(live_server, page, user_id):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, user_id)

    for view in ARTIST_NAV_ITEMS:
        goto_nav(page, view, mobile=False)
        title = page.locator("h1")
        assert title.is_visible(), f"[{user_id}] no <h1> rendered on view '{view}'"
        assert title.inner_text().strip(), f"[{user_id}] empty page title on view '{view}'"

    assert not errors, f"[{user_id}] console errors during nav sweep: {errors}"
