"""
Phase 0: the baseline "is the app fundamentally broken" check.

Real login as every demo-mode role, real clicks through every one of that role's nav items,
asserting no console errors and that real page content rendered at each stop. This replaces the
ad hoc smoke-test JS snippets that used to get hand-written fresh each session.
"""
import pytest
from helpers import (
    ADMIN_IDS, ARTIST_IDS, ARTIST_NAV_ITEMS,
    login_as, goto_nav, collect_console_errors, mgmt_nav_items_for, dismiss_opener,
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


def test_external_events_and_documents_not_in_menu(live_server, page):
    # Removed from the menu for every login (2026-10-09). Checks both reachable menus: the desktop
    # sidebar rail and the mobile hamburger menu.
    for user_id in ADMIN_IDS:
        page.set_viewport_size({"width": 1280, "height": 800})
        page.goto(live_server)
        login_as(page, user_id)
        for view in ("outside_bookings", "documents"):
            assert page.locator(f'.rail-link[data-action="nav"][data-view="{view}"]').count() == 0, (
                f"[{user_id}] '{view}' should no longer be in the sidebar"
            )
        page.set_viewport_size({"width": 390, "height": 844})  # hamburger button is mobile-only
        page.locator('.hamburger-btn').click()
        for view in ("outside_bookings", "documents"):
            assert page.locator(f'.mobile-menu-panel .rail-link[data-view="{view}"]').count() == 0, (
                f"[{user_id}] '{view}' should no longer be in the hamburger menu"
            )


def test_passkey_button_hidden_without_webauthn(live_server, page):
    # A browser with no WebAuthn (e.g. an in-app browser) can't use passkeys -- supabase-js would
    # only answer "Browser does not support WebAuthn". The login screen should offer email only.
    page.add_init_script("delete window.PublicKeyCredential;")
    page.goto(live_server)
    dismiss_opener(page)
    assert page.locator('[data-action="real-signin-passkey"]').count() == 0, "passkey button shown without WebAuthn"
    assert page.locator('.btn-primary[data-action="open-real-signin"]').count() == 1, "email sign-in isn't the primary button"
