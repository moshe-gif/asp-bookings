"""
Phase 1: the same login+nav sweep as test_smoke.py, but at a real narrow viewport via
Playwright's own page.set_viewport_size() — no floor-size bug here (unlike the claude-in-chrome
resize_window tool in this environment), so this is a genuinely narrow phone-width browser, not
a faked-CSS approximation.

Asserts the standing "no sideways scrolling, ever" rule for real, on every screen, instead of by
eye.
"""
import pytest
from helpers import (
    ADMIN_IDS, ARTIST_IDS, MOBILE_ADMIN_NAV, MOBILE_ARTIST_NAV,
    login_as, goto_nav, collect_console_errors, has_no_horizontal_overflow,
)

MOBILE_VIEWPORT = {"width": 390, "height": 844}  # iPhone-ish


@pytest.mark.parametrize("user_id", ADMIN_IDS)
def test_admin_mobile_nav_sweep(live_server, page, user_id):
    page.set_viewport_size(MOBILE_VIEWPORT)
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, user_id)

    for view in MOBILE_ADMIN_NAV:
        goto_nav(page, view, mobile=True)
        assert has_no_horizontal_overflow(page), (
            f"[{user_id}] horizontal overflow on view '{view}' at {MOBILE_VIEWPORT}"
        )

    assert not errors, f"[{user_id}] console errors during mobile nav sweep: {errors}"


@pytest.mark.parametrize("user_id", ARTIST_IDS)
def test_artist_mobile_nav_sweep(live_server, page, user_id):
    page.set_viewport_size(MOBILE_VIEWPORT)
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, user_id)

    for view in MOBILE_ARTIST_NAV:
        goto_nav(page, view, mobile=True)
        assert has_no_horizontal_overflow(page), (
            f"[{user_id}] horizontal overflow on view '{view}' at {MOBILE_VIEWPORT}"
        )

    assert not errors, f"[{user_id}] console errors during mobile nav sweep: {errors}"
