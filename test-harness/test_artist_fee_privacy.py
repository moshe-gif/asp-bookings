"""
What an artist sees about money on their own gigs.

History: PR 15 hid the client's full price from artists. On 2026-10-11 the owner reversed part of
that on purpose: an artist now DOES see the gig amount, ASP's fee with that gig's own percentage,
and what they receive (migration 0038 / the artist portal). Still hidden:
  - the "Total charged to client" package line, and on a shared (multi-artist) gig any number at
    all until the artist's own share is set ("Amount being confirmed");
  - any owes / owed / receivable / balance-pending wording -- an artist never owes.

Runs as benny (artist) on locally seeded gigs (the harness keeps the live artist views off; the
live-data path is test_artist_portal_real_data.py).
"""
import re

from helpers import login_as, goto_nav, collect_console_errors, fake_gig, seed_events

BENNY_GIGS = [
    # A 12% fee, so the page must show the gig's own percentage, not the standard 15%.
    fake_gig("EV-9001", "benny", "2099-03-14", price=12000, commission=1440),
    fake_gig("EV-9002", "benny", "2099-04-20", price=30000, commission=4500,
             additionalArtists=[{"artistId": "eli", "feeAmount": 9000}]),
]
OWES = re.compile(r"\bowe[sd]?\b|\bowing\b|receivable|balance pending|balance due", re.I)


def _open_gig(page, gig_id):
    page.locator(f'tr[data-action="open-event"][data-id="{gig_id}"]').first.click()
    sheet = page.locator(".sheet")
    assert sheet.is_visible(), "event sheet didn't open"
    return sheet.inner_text()


def test_my_gigs_shows_what_you_receive(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, BENNY_GIGS)
    page.goto(live_server)
    login_as(page, "benny")
    goto_nav(page, "a_gigs", mobile=False)

    assert page.locator("th", has_text="You Receive").first.is_visible(), "My Gigs has no 'You Receive' column"
    assert page.locator("th", has_text="Price").count() == 0, "My Gigs still has the office 'Price' column"
    row = page.locator('tr[data-action="open-event"][data-id="EV-9001"]')
    assert "$10,560" in row.inner_text(), "solo gig row doesn't show what the artist receives"
    shared = page.locator('tr[data-action="open-event"][data-id="EV-9002"]').inner_text()
    assert "Being confirmed" in shared and "$" not in shared, "shared gig row shows numbers before the artist's share is set"
    assert row.locator('a', has_text="Navigate (Waze)").count() == 1, "My Gigs row has no Waze link"
    assert not OWES.search(page.locator("#app").inner_text()), "owes wording on My Gigs"
    assert not errors, f"console errors on My Gigs as an artist: {errors}"


def test_event_sheet_shows_amount_fee_percent_and_net(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, BENNY_GIGS)
    page.goto(live_server)
    login_as(page, "benny")
    goto_nav(page, "a_gigs", mobile=False)

    text = _open_gig(page, "EV-9001")
    assert "Gig amount" in text and "$12,000" in text, "artist doesn't see the gig amount"
    assert "ASP fee 12%" in text and "$1,440" in text, "artist doesn't see this gig's own ASP fee percent"
    assert "You receive" in text and "$10,560" in text, "artist doesn't see what they receive"
    assert "Total charged to client" not in text, "artist sees the client total line"
    assert not OWES.search(text), "owes wording on the artist's event sheet"
    assert not errors, f"console errors opening an event sheet as an artist: {errors}"


def test_shared_gig_hides_package_money(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, BENNY_GIGS)
    page.goto(live_server)
    login_as(page, "benny")
    goto_nav(page, "a_gigs", mobile=False)

    text = _open_gig(page, "EV-9002")
    assert "Amount being confirmed" in text, "shared gig doesn't say the amount is being confirmed"
    assert "Total charged to client" not in text, "shared gig shows the package total"
    for figure in ("$30,000", "$4,500", "$25,500", "$9,000"):
        assert figure not in text, f"shared gig shows package/other-artist money ({figure})"
    assert not OWES.search(text), "owes wording on a shared gig"
    assert not errors, f"console errors on a shared gig as an artist: {errors}"


def test_financials_use_each_gigs_percent_and_no_owes(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, BENNY_GIGS)
    page.goto(live_server)
    login_as(page, "benny")
    goto_nav(page, "a_financials", mobile=False)

    body = page.locator("#app").inner_text()
    assert "12%" in body, "Financials doesn't show the gig's own ASP percent"
    assert "Received via Zelle" not in body, "old 'YTD Payout ... Received via Zelle' wording is back"
    assert "paid to you (ytd)" in body.lower(), "Financials has no paid-to-you YTD tile"
    assert "Amount being confirmed" in body, "shared gig isn't marked as being confirmed on Financials"
    assert not OWES.search(body), "owes wording on the artist's Financials"
    assert not errors, f"console errors on Financials as an artist: {errors}"


def test_office_day_shows_without_money(live_server, page):
    """Owner 2026-10-12: artists see their office days (never leads); an office day has no money."""
    errors = collect_console_errors(page)
    seed_events(page, BENNY_GIGS + [fake_gig("EV-9003", "benny", "2099-05-01", unpaid=True, status="scheduled",
                                             type="Recording Day", clientName=None, price=0, commission=0)])
    page.goto(live_server)
    login_as(page, "benny")
    goto_nav(page, "a_gigs", mobile=False)
    row = page.locator('tr[data-action="open-event"][data-id="EV-9003"]').inner_text()
    assert "Recording Day" in row and "Office day" in row, "office day missing or mislabeled on My Gigs"
    assert "$" not in row and "Being confirmed" not in row, "an office day shows money"
    assert not errors, f"console errors: {errors}"
