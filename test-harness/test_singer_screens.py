"""
The singer's side, 2026-11-10 owner requests:
  - "it should auto update his calendar": no per-gig Add to Google Calendar / Download .ics; one
    "Put your gigs in your calendar" card (the cal-feed subscription) on the singer home.
  - "make the navigate buttons bigger": Waze + Google Maps are two big buttons (>= 48px tall).
  - "add a total row": My Jobs (Financials) ends with a Total row (gig amount, ASP fee, you receive).
  - "we should add a whatsapp option": Settings shows the singer's real message choices with an
    Email / WhatsApp switch each (saved on the server; disabled without a real session here).
Runs as benny on locally seeded gigs.
"""
from datetime import date

from helpers import login_as, goto_nav, collect_console_errors, fake_gig, seed_events

TODAY = date.today().isoformat()
GIGS = [
    fake_gig("EV-9301", "benny", TODAY, price=10000, commission=1500, venue="The Rockleigh", city="Rockleigh", state="NJ"),
    fake_gig("EV-9302", "benny", "2099-05-01", price=8000, commission=1200, venue="Lake Terrace", city="Lakewood", state="NJ"),
]


def test_singer_home_calendar_and_big_nav(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, GIGS)
    page.goto(live_server)
    login_as(page, "benny")
    assert page.locator('[data-testid="cal-subscribe"]').is_visible(), "no calendar subscribe card on the singer home"
    nav = page.locator('[data-testid="nav-buttons"]').first
    assert nav.is_visible(), "no big navigate buttons for today's gig"
    for b in nav.locator("a").all():
        assert b.bounding_box()["height"] >= 48, "navigate button is not big"

    goto_nav(page, "a_gigs", mobile=False)
    page.locator('tr[data-action="open-event"][data-id="EV-9302"]').first.click()
    sheet = page.locator(".sheet").first
    sheet.wait_for(state="visible")
    text = sheet.inner_text()
    assert "Download .ics" not in text and "Add to Google Calendar" not in text, "per-gig calendar buttons still there"
    assert sheet.locator('[data-testid="nav-buttons"]').is_visible(), "gig sheet has no big navigate buttons"
    assert not errors, f"console errors: {errors}"


def test_my_jobs_total_row(live_server, page):
    seed_events(page, GIGS)
    page.goto(live_server)
    login_as(page, "benny")
    goto_nav(page, "a_financials", mobile=False)
    total = page.locator('[data-testid="jobs-total"]')
    assert total.is_visible(), "My Jobs has no Total row"
    t = total.inner_text()
    assert "$18,000" in t and "$2,700" in t and "$15,300" in t, t


def test_singer_message_choices(live_server, page):
    page.goto(live_server)
    login_as(page, "benny")
    goto_nav(page, "settings", mobile=False) if page.locator('.rail-link[data-view="settings"], .top-tab[data-view="settings"]').count() else page.evaluate("location.hash = '#/settings'")
    card = page.locator('[data-testid="singer-notify"]')
    card.wait_for(state="visible")
    text = card.inner_text()
    assert "WHATSAPP" in text.upper() and "EMAIL" in text.upper(), text
    assert card.locator('[data-action="toggle-singer-notify"]').count() == 3
