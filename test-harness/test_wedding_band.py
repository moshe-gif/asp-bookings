"""
Wedding-only "Band" fields: New Lead reveals a "Which Band Is Playing" + "Band Size" section
the moment Event Type is set to Wedding (hidden for every other type), and the entered values
persist onto the event and show up on its detail sheet -- both at creation and via Edit Details.
"""
from helpers import login_as, collect_console_errors


def test_band_fields_hidden_until_wedding_selected(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    page.locator('[data-action="open-new-lead"]').click()
    band_input = page.locator('input[data-field="band"]')
    assert not band_input.is_visible(), "band field visible before Wedding is explicitly selected"

    page.locator('[data-action="pick-event-type"]').select_option("Bar Mitzvah")
    assert not band_input.is_visible(), "band field visible for a non-Wedding event type"

    page.locator('[data-action="pick-event-type"]').select_option("Wedding")
    assert band_input.is_visible(), "band field did not appear after selecting Wedding"
    assert page.locator('input[data-field="bandSize"]').is_visible(), "band size field did not appear after selecting Wedding"

    assert not errors, f"console errors toggling event type: {errors}"


def test_band_fields_saved_and_shown_on_new_lead(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    page.locator('[data-action="open-new-lead"]').click()
    page.locator('[data-action="pick-artist"][data-id="benny"]').click()
    page.locator('input[data-field="clientName"]').fill("Wedding Band Test Client")
    page.locator('input[data-field="date"]').fill("2027-06-15")
    page.locator('[data-action="pick-event-type"]').select_option("Wedding")
    page.locator('input[data-field="band"]').fill("Simcha Players")
    page.locator('input[data-field="bandSize"]').fill("5")
    page.locator('[data-action="submit-lead"]').click()

    sheet = page.locator(".sheet")
    assert sheet.is_visible(), "event sheet didn't open after submitting a wedding lead"
    text = sheet.inner_text()
    assert "Simcha Players" in text, "band name not shown on the new wedding lead's detail sheet"
    assert "5 pieces" in text, "band size not shown on the new wedding lead's detail sheet"

    assert not errors, f"console errors during wedding-lead-with-band flow: {errors}"


def test_band_fields_editable_and_hidden_for_other_types(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    # Create as a non-Wedding type first, then edit into Wedding -- confirms Edit Details reacts
    # to a type change the same way New Lead does, not just at creation time.
    page.locator('[data-action="open-new-lead"]').click()
    page.locator('[data-action="pick-artist"][data-id="benny"]').click()
    page.locator('input[data-field="clientName"]').fill("Concert To Wedding Client")
    page.locator('input[data-field="date"]').fill("2027-07-01")
    page.locator('[data-action="pick-event-type"]').select_option("Concert")
    page.locator('[data-action="submit-lead"]').click()

    sheet = page.locator(".sheet")
    assert "Band" not in sheet.inner_text(), "Band row shown on a non-Wedding event's detail sheet"

    page.locator('[data-action="open-edit-event"]').click()
    assert not page.locator('input[data-field="band"]').is_visible(), "band field visible in Edit Details before switching to Wedding"

    page.locator('.edit-event-type-select').select_option("Wedding")
    assert page.locator('input[data-field="band"]').is_visible(), "band field did not appear in Edit Details after switching type to Wedding"
    page.locator('input[data-field="band"]').fill("Kol Simcha Orchestra")
    page.locator('input[data-field="bandSize"]').fill("1")
    page.locator('[data-action="save-edit-event"]').click()

    text = sheet.inner_text()
    assert "Kol Simcha Orchestra" in text, "band name not reflected on detail sheet after editing type to Wedding"
    assert "1 piece" in text and "1 pieces" not in text, "singular 'piece' not used for a band size of 1"

    assert not errors, f"console errors during edit-to-wedding band flow: {errors}"
