"""
2026-10-09 audit W2-6 (2.16/3.10/3.8): the Financials per-artist card labelled "gross, last 6 mo"
summed ALL-TIME bookings; YTD payout parsed date-only strings as UTC (Jan 1 counted as last year in
US time zones); "15%"/"85%" labels were hardcoded. Shared helpers now own the month buckets / YTD.
"""
import datetime

from helpers import login_as, goto_nav, collect_console_errors, fake_gig, seed_events

TODAY = datetime.date.today()
OLD = (TODAY.replace(day=1) - datetime.timedelta(days=245)).isoformat()  # ~8 months ago
THIS_MONTH = TODAY.replace(day=1).isoformat()
JAN_1 = TODAY.replace(month=1, day=1).isoformat()

GIGS = [
    fake_gig("EV-9301", "benny", OLD, price=5000, commission=750),
    fake_gig("EV-9302", "benny", THIS_MONTH, price=7000, commission=1050,
             balanceReceived=True, balanceReceivedDate=JAN_1, status="paid",
             artistPaidOut=True, artistPaidOutDate=JAN_1),
]


def test_artist_card_six_month_total_and_labels(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, GIGS)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "financials")
    card = page.locator(".card", has_text="Benny Friedman").filter(has_text="last 6 mo").first
    text = card.inner_text()
    assert "$7,000" in text and "$12,000" not in text, f"6-month card total wrong: {text}"
    body = page.locator("#app").inner_text()
    assert "85% via Zelle" not in body
    assert not errors, f"console errors: {errors}"


def test_ytd_counts_a_january_first_payment(live_server, page):
    seed_events(page, GIGS)
    page.goto(live_server)
    login_as(page, "benny")
    goto_nav(page, "a_financials")
    # Artist YTD = paid to the artist this year, by payout date (2026-10-11 artist portal).
    tile = page.locator(".stat-tile", has_text="(YTD)").first
    assert "$5,950" in tile.inner_text(), tile.inner_text()  # 7000 - 1050 commission, paid out Jan 1
