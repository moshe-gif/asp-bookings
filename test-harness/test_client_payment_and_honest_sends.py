"""
2026-10-09 audit fixes W1-3:
- 2.4/3.11: client balance emails name the payee profile's Zelle (or tell the client to contact the
  office) -- never the artist's app login email -- and the in-app preview is built by the same
  function as the email that is actually sent.
- 2.5: the event sheet's primary contract button used to send nothing while logging "emailed" and
  marking the lead contract_sent. It now routes to the real Contract Builder send path.
"""
from helpers import login_as, goto_nav, collect_console_errors, fake_gig, seed_events

GIGS = [
    fake_gig("EV-9101", "benny", "2027-05-02", clientEmail="client@example.com", status="booked"),
    fake_gig("EV-9102", "benny", "2027-06-06", clientEmail="lead@example.com", status="lead", depositReceived=False),
]


def _open_gig(page, view, client_name):
    goto_nav(page, view)
    page.locator('[data-action="open-event"]', has_text=client_name).first.click()
    page.locator(".sheet").first.wait_for(state="visible")


def test_reminder_preview_never_uses_artist_login_email(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, GIGS)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _open_gig(page, "financials", "Test Client EV-9101")
    page.locator('[data-action="preview-reminder"]').first.click()
    preview = page.locator('.doc', has_text="Reminder Email Preview").first
    preview.wait_for(state="visible")
    text = preview.inner_text()
    assert "@aspmanagement.com" not in text, f"preview tells the client to Zelle an app login email: {text}"
    assert ("directly to" in text) or ("send to" in text) or ("scan the code" in text) or ("contact the office" in text), text
    assert not errors, f"console errors: {errors}"


def test_primary_contract_button_routes_to_real_builder_and_logs_nothing(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, GIGS)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _open_gig(page, "leads", "Test Client EV-9102")
    page.locator('[data-action="send-contract"]').first.click()
    page.locator('#templatePickerOverlayHost').wait_for(state="attached")
    assert page.locator('[data-action="pick-template-create"]').count() > 0, "template picker didn't open"
    ev = page.evaluate("() => window.S.events.find(e => e.id === 'EV-9102')")
    assert ev["status"] == "lead", f"lead status changed without a real send: {ev['status']}"
    assert not any("emailed" in (l.get("text") or "") for l in ev.get("log", [])), ev.get("log")
    assert not errors, f"console errors: {errors}"
