"""
A venue the app doesn't know yet gets its address looked up (owner 2026-10-29: "why does it not auto fill
address" after typing "rockliegh"). Real call to venue-lookup (Claude + web search), real clicks.
"""
from helpers import login_as, collect_console_errors


def test_unknown_venue_fills_its_address(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.locator('[data-action="open-new-lead"]').click()
    venue = page.locator('[data-form="lead"] [data-field="venue"]')
    venue.fill("rockliegh")
    venue.press("Tab")
    addr = page.locator('[data-form="lead"] [data-field="address"]')
    page.wait_for_function("() => (document.querySelector('[data-form=\"lead\"] [data-field=\"address\"]') || {}).value", timeout=90000)
    assert "paris" in addr.input_value().lower(), addr.input_value()        # The Rockleigh, 26 Paris Ave
    assert "rockleigh" in venue.input_value().lower(), "the name's spelling is fixed"
    assert page.locator('[data-form="lead"] [data-field="city"]').input_value()
    assert not errors, f"console errors: {errors}"
