"""
Durable booking record architecture, PR 6: the audited "Verify Deposit & Confirm" flow
(doMarkDepositVerified/doConfirmBooking in frontend/workspaces/asp.js), alongside the existing
blind "Mark Booking Fee Received" button — real clicks only, no state shortcuts, per this
harness's standing convention.

Runs as admin_bookings (Contract Builder/admin-only actions are not visible to admin_ceo).
"""
from helpers import login_as, collect_console_errors


def _create_lead_to_contract_sent(page, client_name):
    """Real clicks: new lead -> Send Contract + Invoice. Lands the event in 'contract_sent'."""
    page.locator('[data-action="open-new-lead"]').click()
    page.locator('[data-action="pick-artist"][data-id="benny"]').click()
    page.locator('input[data-field="clientName"]').fill(client_name)
    page.locator('input[data-field="date"]').fill("2027-08-20")
    page.locator('[data-action="submit-lead"]').click()

    sheet = page.locator(".sheet")
    assert sheet.is_visible(), "event sheet didn't open after submitting a lead"
    page.locator('[data-action="send-contract"]').click()
    assert "Contract Sent" in sheet.inner_text(), "lead didn't reach Contract Sent after Send Contract + Invoice"


def test_verify_deposit_button_present_alongside_existing_mark_deposit(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _create_lead_to_contract_sent(page, "Test Harness Deposit Gate")

    sheet = page.locator(".sheet")
    assert sheet.locator('[data-action="mark-deposit"]').is_visible(), (
        "existing blind Mark Booking Fee Received button missing — PR 6 must not replace it"
    )
    assert sheet.locator('[data-action="open-verify-deposit"]').is_visible(), (
        "new Verify Deposit & Confirm (audited) button missing"
    )
    assert not errors, f"console errors after reaching Contract Sent: {errors}"


def test_verify_deposit_blocks_empty_note(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _create_lead_to_contract_sent(page, "Test Harness Empty Note")

    page.locator('[data-action="open-verify-deposit"]').click()
    modal = page.locator('[data-form="verifydeposit"]')
    assert modal.is_visible(), "Verify Deposit modal didn't open"

    page.locator('[data-action="confirm-verify-deposit"]').click()
    # The gate (doMarkDepositVerified) returns early on an empty note -- modal must still be open,
    # not silently confirmed.
    assert modal.is_visible(), "modal closed / booking confirmed despite no verification note"
    assert not errors, f"console errors during empty-note gate check: {errors}"


def test_verify_deposit_with_note_confirms_booking_and_logs_audit_trail(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _create_lead_to_contract_sent(page, "Test Harness Verified Deposit")

    page.locator('[data-action="open-verify-deposit"]').click()
    modal = page.locator('[data-form="verifydeposit"]')
    modal.locator('select[data-field="method"]').select_option("wire")
    modal.locator('textarea[data-field="note"]').fill("Wire confirmed by bank statement, test harness.")
    page.locator('[data-action="confirm-verify-deposit"]').click()

    # doConfirmBooking runs doMarkDeposit's real existing effects -- status flips to Booked and the
    # booking-confirmation modal opens, exactly like the original blind-click flow.
    assert page.get_by_text("Booking Confirmation").is_visible(), (
        "booking confirmation modal didn't open after a verified deposit"
    )
    page.locator('[data-action="close-booking-confirmation"]').click()

    sheet = page.locator(".sheet")
    assert "Booked" in sheet.inner_text(), "event status didn't flip to Booked after verified deposit"
    activity_text = sheet.inner_text()
    assert "Deposit verified (wire)" in activity_text, (
        "activity log missing the new structured verification entry"
    )
    assert "Wire confirmed by bank statement" in activity_text, (
        "verification note not recorded in the activity log"
    )
    assert not errors, f"console errors during verified-deposit confirm flow: {errors}"
