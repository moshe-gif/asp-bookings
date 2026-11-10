"""
Price list (owner 2026-11-10), v1.9.70: one flat fee per singer x event type, an out-of-town fee (+ travel), hours
and a note, in the office's shared settings. Seeds a fictional list in this browser only (no sync):

- New Lead fills the singer's fee for the type; ticking "Flight needed" switches to the out-of-town fee;
- a price typed by hand is never replaced;
- a date after the "confirm with Moshe" day shows the warning;
- the end time follows the hours the price covers;
- the Pricing page edits a fee and New Lead uses the new one.
"""
import json
from helpers import login_as, goto_nav

LIST = {"moshe": {"Wedding": {"fee": 1100, "outOfTownFee": 2200, "hours": 5, "note": "Sample note."}},
        "shmili": {"Wedding": {"fee": 900, "outOfTownFee": 0, "hours": 0.75, "note": "Short set."}}}


def _open_lead(page, artist, type_="Wedding"):
    page.locator('[data-action="open-new-lead"]').click()
    page.locator('select[data-action="pick-artist"]').select_option(artist)
    page.locator('select[data-action="pick-event-type"]').select_option(type_)


def _price(page):
    return page.locator('[data-form="lead"] input[data-field="price"], .modal input[data-field="price"]').first.input_value()


def test_price_list_fills_new_lead(live_server, page):
    page.context.add_init_script(f"localStorage.setItem('asp_mock_pricing_v1', {json.dumps(json.dumps(LIST))});")
    page.goto(live_server)
    login_as(page, "admin_bookings")

    _open_lead(page, "moshe")
    assert _price(page) == "1100"
    hint = page.locator('[data-testid="price-hint"]').inner_text()
    assert "Out of town" in hint and "Sample note." in hint, hint
    page.locator('#flightck').check()
    assert _price(page) == "2200", "out of town didn't switch to the out-of-town fee"
    page.locator('#flightck').uncheck()
    assert _price(page) == "1100"

    price = page.locator('.modal input[data-field="price"]').first
    price.fill("1234")
    page.locator('#flightck').check()
    assert _price(page) == "1234", "a typed price was replaced"

    page.locator('input[data-field="date"]').fill("2027-06-01")
    page.locator('[data-testid="price-confirm"]').wait_for(state="visible")
    page.locator('input[data-field="date"]').fill("2027-01-10")
    assert page.locator('[data-testid="price-confirm"]').count() == 0
    page.keyboard.press("Escape")

    # Shmili's third dance: 45 minutes from the 7pm default start.
    page.goto(live_server)
    _open_lead(page, "shmili")
    assert _price(page) == "900"
    end = page.locator('.modal input[data-field="endTime"]').first.input_value()
    assert end == "19:45", end

    page.goto(live_server)
    page.locator('[data-action="open-new-lead"]').first.wait_for(state="visible", timeout=20000)
    goto_nav(page, "pricing")
    chip = page.locator('button[data-action="pricing-artist"][data-id="moshe"]')
    if chip.is_visible():
        chip.click()
    else:
        page.locator('select[data-action="pricing-artist"]').select_option("moshe")
    fee = page.locator('[data-testid="pricing-row"][data-type="Wedding"] input[data-key="fee"]')
    assert fee.input_value() == "1100"
    fee.fill("1150")
    fee.press("Tab")
    page.wait_for_function("() => JSON.parse(localStorage.getItem('asp_mock_pricing_v1')).moshe.Wedding.fee === 1150")
    _open_lead(page, "moshe")
    assert _price(page) == "1150"
