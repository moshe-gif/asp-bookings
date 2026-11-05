"""
The client's event details form on the gig (0081, owner 2026-11-05): Gig Info shows whether the client filled it
in, the answers open with "See answers", and the gig sheet print view lists the answers that have no other place
(yes/no questions, notes). Concerts get no form. The form page itself (frontend/form/) and the gig-form Edge
Function were checked against the live function with a throwaway gig; sending/copying a link needs a real
session, so it isn't clicked here.
"""
from helpers import login_as, goto_nav, collect_console_errors, fake_gig, seed_events

FORM = {"kind": "wedding", "submittedAt": "2026-11-05T16:00:00Z", "answers": {"flashMob": "Yes", "sChosson": "Aheim"},
        "sections": [{"title": "Chuppah songs", "rows": [{"label": "Chosson walking down", "value": "Aheim", "placed": True}]},
                     {"title": "Reception", "rows": [{"label": "Flash mob", "value": "Yes"}]}]}
GIGS = [
    fake_gig("EV-9701", "benny", "2099-05-10", clientName="Form Filled Client", clientForm=FORM,
             gigInfoSheet={"songs": [{"moment": "Chosson walking down", "song": "Aheim"}]}),
    fake_gig("EV-9702", "benny", "2099-05-11", clientName="Form Waiting Client"),
    fake_gig("EV-9703", "benny", "2099-05-12", clientName="Concert Client", type="Concert"),
]


def _start(live_server, page):
    seed_events(page, GIGS)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "leads")


def _open(page, gid):
    page.locator(f'[data-action="open-event"][data-id="{gid}"]').first.click()
    sheet = page.locator(".sheet")
    sheet.wait_for(state="visible")
    return sheet


def test_filled_in_form_shows_answers_and_prints(live_server, page):
    errors = collect_console_errors(page)
    _start(live_server, page)
    sheet = _open(page, "EV-9701")
    block = sheet.locator('[data-testid="client-form-block"]')
    assert "Filled in by the client" in block.inner_text()
    block.locator('[data-action="clientform-toggle"]').click()
    text = page.locator('.sheet [data-testid="client-form-block"]').inner_text()
    assert "Flash mob" in text and "Chosson walking down" in text, "answers don't open"
    assert page.locator('.sheet [data-action="gigform-copy"]').count() == 1 and page.locator('.sheet [data-action="gigform-send"]').count() == 1
    page.locator('.sheet [data-action="view-giginfo"]').first.click()
    doc = page.locator("body").inner_text()
    assert "from the client's form" in doc.lower() and "Flash mob" in doc, "print view misses the client's other answers"
    assert not errors, f"console errors: {errors}"


def test_waiting_form_and_no_form_for_concerts(live_server, page):
    errors = collect_console_errors(page)
    _start(live_server, page)
    sheet = _open(page, "EV-9702")
    assert "Not filled in yet" in sheet.locator('[data-testid="client-form-block"]').inner_text()
    page.locator('.sheet [data-action="close-sheet"]').first.click()
    sheet.wait_for(state="hidden")
    sheet = _open(page, "EV-9703")
    assert sheet.locator('[data-testid="client-form-block"]').count() == 0, "a concert shows the client form"
    assert not errors, f"console errors: {errors}"
