"""
Real click-through of the new "Edit" button on an event/lead/booking's detail sheet: every core
field (client name/email/phone, type, date/time, venue, price) is now editable after creation,
not just at New Lead time. Also confirms price edits recompute commission/payout, not just the
raw number.

Creates a fresh lead first (rather than editing a seeded demo event) so the payout math is
predictable -- a brand-new lead always starts with an empty charges list, so its displayed payout
is exactly price*0.85, with no pre-existing "+ Add Charge" line to account for.
"""
from helpers import login_as, collect_console_errors


def test_edit_event_updates_core_fields(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    page.locator('[data-action="open-new-lead"]').click()
    page.locator('[data-action="pick-artist"][data-id="benny"]').click()
    page.locator('input[data-field="clientName"]').fill("Original Client")
    page.locator('input[data-field="date"]').fill("2027-06-15")
    page.locator('[data-action="submit-lead"]').click()

    sheet = page.locator(".sheet")
    assert sheet.is_visible(), "event sheet didn't open after submitting a lead"

    page.locator('[data-action="open-edit-event"]').click()

    page.locator('input[data-field="clientName"]').fill("Edited Client Name")
    page.locator('input[data-field="venue"]').fill("Edited Venue Hall")
    page.locator('input[data-field="price"]').fill("5000")
    page.locator('[data-action="save-edit-event"]').click()

    assert "Edited Client Name" in sheet.inner_text(), "edited client name not reflected in event sheet"
    assert "Edited Venue Hall" in sheet.inner_text(), "edited venue not reflected in event sheet"
    # 5000 * 15% commission = 750 ASP cut, 4250 artist payout -- confirm the ledger recomputed,
    # not just the raw price field. Fresh lead has no charges, so payout == price*0.85 exactly.
    assert "$4,250" in sheet.inner_text(), "payout did not recompute after editing price"

    assert not errors, f"console errors during edit-event flow: {errors}"
