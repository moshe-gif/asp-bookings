"""
Navigation/data-layer refactor, PR 15: an artist's own session must never show the full client
package price, only their own fee/net. Two real leaks fixed here:
  - My Gigs (renderArtistGigs -> renderEventTable) reused the office "Price" column verbatim
    (money(e.price), the full client price) instead of the artist's own fee.
  - The event detail sheet's "Price Breakdown" (renderLedger) showed "Performance Fee" (ev.price)
    and "Total charged to client" unconditionally, even to the artist whose own gig it was.

Runs as benny (artist).
"""
from helpers import login_as, goto_nav, collect_console_errors


def test_my_gigs_shows_your_fee_not_client_price(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "benny")
    goto_nav(page, "a_gigs", mobile=False)

    assert page.get_by_text("Your Fee", exact=True).first.is_visible(), (
        "My Gigs table doesn't show the relabeled 'Your Fee' column"
    )
    assert page.locator("th", has_text="Price").count() == 0, (
        "My Gigs table still has a raw 'Price' column header — client price is leaking to the artist"
    )
    assert not errors, f"console errors on My Gigs as an artist: {errors}"


def test_event_sheet_hides_client_price_from_artist(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "benny")
    goto_nav(page, "a_gigs", mobile=False)

    row = page.locator('tr[data-action="open-event"]').first
    assert row.count() > 0, "no seeded gigs for benny to open — check demo data"
    row.click()

    sheet = page.locator(".sheet")
    assert sheet.is_visible(), "event sheet didn't open"
    sheet_text = sheet.inner_text()
    assert "Performance Fee" not in sheet_text, "artist's own event sheet shows the client's Performance Fee line"
    assert "Total charged to client" not in sheet_text, "artist's own event sheet shows the client's total"
    assert "You walk away with" in sheet_text, "artist's own payout line is missing from the ledger"
    assert not errors, f"console errors opening an event sheet as an artist: {errors}"
