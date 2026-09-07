"""
Phase 0: the baseline "is the app fundamentally broken" check.

Real login as every demo-mode role, real clicks through every one of that role's nav items,
asserting no console errors and that real page content rendered at each stop. This replaces the
ad hoc smoke-test JS snippets that used to get hand-written fresh each session.
"""
import pytest
from helpers import (
    ADMIN_IDS, ARTIST_IDS, ARTIST_NAV_ITEMS,
    login_as, goto_nav, collect_console_errors, mgmt_nav_items_for,
)


@pytest.mark.parametrize("user_id", ADMIN_IDS)
def test_admin_nav_sweep(live_server, page, user_id):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, user_id)

    for view in mgmt_nav_items_for(user_id):
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


def test_outside_bookings_hidden_from_ceo(live_server, page):
    # Scoped to .rail-link specifically: the mobile bottom-nav's own outside_bookings button
    # exists in the DOM but display:none for EVERY admin role (same as artists/travel/pricing/
    # messages already are) -- that's an existing, unrelated pattern, not a visibility leak.
    # The desktop rail and the hamburger menu's rail-nav are the two reachable places a nav item
    # actually shows up; CEO must not see it in either.
    page.goto(live_server)
    login_as(page, "admin_ceo")
    assert page.locator('.rail-link[data-action="nav"][data-view="outside_bookings"]').count() == 0, (
        "CEO login should not see Outside Bookings in the sidebar"
    )
    assert page.locator('.rail-link[data-action="nav"][data-view="documents"]').count() == 0, (
        "CEO login should not see Documents in the sidebar"
    )
    page.set_viewport_size({"width": 390, "height": 844})  # hamburger button is mobile-only
    page.locator('.hamburger-btn').click()
    assert page.locator('.mobile-menu-panel .rail-link[data-view="outside_bookings"]').count() == 0, (
        "CEO login should not see Outside Bookings in the hamburger menu"
    )
    assert page.locator('.mobile-menu-panel .rail-link[data-view="documents"]').count() == 0, (
        "CEO login should not see Documents in the hamburger menu"
    )


def test_outside_bookings_visible_for_office_logins(live_server, page):
    for user_id in ("admin_bookings", "admin_bookkeeping"):
        page.goto(live_server)
        login_as(page, user_id)
        assert page.locator('.rail-link[data-action="nav"][data-view="outside_bookings"]').count() == 1, (
            f"[{user_id}] should see the Outside Bookings nav item"
        )
        assert page.locator('.rail-link[data-action="nav"][data-view="documents"]').count() == 1, (
            f"[{user_id}] should see the Documents nav item"
        )
