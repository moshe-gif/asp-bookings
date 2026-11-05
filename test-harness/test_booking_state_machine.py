"""
Recording a deposit that didn't come in online: one Record deposit button (owner 2026-11-05; it replaced
"Mark Booking Fee Received" and "Verify Deposit & Confirm") -- doMarkDepositVerified/doConfirmBooking in
frontend/workspaces/asp.js — real clicks only, no state shortcuts, per this
harness's standing convention.

Runs as admin_bookings (Contract Builder/admin-only actions are not visible to admin_ceo).
"""
from helpers import login_as, collect_console_errors, mark_contract_sent_from_event_sheet, create_lead, record_deposit


def _create_lead_to_contract_sent(page, client_name):
    """Real clicks: new lead -> contract button -> Contract Builder -> mark the contract Sent (the
    "went out another way" path; a real email send advances the lead the same way). Lands the
    event in 'contract_sent'. (Until 2026-10-09 the event-sheet button faked a send.)"""
    create_lead(page, client_name, "2027-08-20", artist_id="benny")

    sheet = page.locator(".sheet")
    assert sheet.is_visible(), "event sheet didn't open after submitting a lead"
    mark_contract_sent_from_event_sheet(page)
    assert "Contract Sent" in sheet.inner_text(), "lead didn't reach Contract Sent after marking its contract sent"


def test_one_record_deposit_button(live_server, page):
    """Owner 2026-11-05: one Record deposit button replaces "Mark Booking Fee Received" and "Verify Deposit"."""
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _create_lead_to_contract_sent(page, "Test Harness Deposit Gate")

    sheet = page.locator(".sheet")
    assert sheet.locator('[data-testid="record-deposit"]').is_visible(), "Record deposit button missing"
    assert sheet.locator('[data-action="mark-deposit"]').count() == 0, "the old Mark Booking Fee Received button is still there"
    assert "isn't connected" not in page.locator("body").inner_text()
    assert not errors, f"console errors after reaching Contract Sent: {errors}"


def test_record_deposit_without_note_books_the_gig(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _create_lead_to_contract_sent(page, "Test Harness Empty Note")

    record_deposit(page, "zelle")
    assert page.get_by_text("Booking Confirmation").is_visible(), "booking confirmation didn't open"
    page.locator('[data-action="close-booking-confirmation"]').click()
    text = page.locator(".sheet").inner_text()
    assert "Booked" in text and "Deposit recorded (Zelle)." in text, "deposit not recorded without a note"
    assert not errors, f"console errors: {errors}"


def test_record_deposit_with_method_and_note_logs_it(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _create_lead_to_contract_sent(page, "Test Harness Verified Deposit")

    record_deposit(page, "wire", "Wire confirmed by bank statement, test harness.")
    assert page.get_by_text("Booking Confirmation").is_visible(), (
        "booking confirmation modal didn't open after recording the deposit"
    )
    page.locator('[data-action="close-booking-confirmation"]').click()

    sheet = page.locator(".sheet")
    activity_text = sheet.inner_text()
    assert "Booked" in activity_text, "event status didn't flip to Booked"
    assert "Deposit recorded (Wire): Wire confirmed by bank statement" in activity_text, "method/note not in the activity log"
    assert not errors, f"console errors during the record-deposit flow: {errors}"


def test_concurrent_record_deposit_surfaces_conflict_instead_of_silent_overwrite(live_server, page):
    """
    Two real tabs both load the same contract_sent event; tab B records the deposit first; tab A, still
    holding its stale copy, then tries the same -- this must surface a conflict toast, not silently
    re-save tab A's stale view over tab B's write (updateEvent()'s concurrency check).
    """
    errors_a = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _create_lead_to_contract_sent(page, "Test Harness Concurrent Deposit")

    page_b = page.context.new_page()
    errors_b = collect_console_errors(page_b)
    page_b.goto(live_server)
    login_as(page_b, "admin_bookings")
    page_b.get_by_text("Test Harness Concurrent Deposit").first.click()
    record_deposit(page_b)
    assert page_b.get_by_text("Booking Confirmation").is_visible()
    page_b.locator('[data-action="close-booking-confirmation"]').click()
    page_b.close()

    record_deposit(page)
    assert page.get_by_text("changed elsewhere since you loaded it").is_visible(), (
        "stale tab's record-deposit attempt did not surface the expected conflict toast"
    )
    assert not errors_a, f"console errors in tab A: {errors_a}"
    assert not errors_b, f"console errors in tab B: {errors_b}"


def test_admin_confirms_a_new_lead(live_server, page):
    """Owner 2026-10-29: a Confirm Booking button on a new lead (no contract / deposit step first)."""
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    create_lead(page, "Test Harness Confirm Lead", "2027-08-21", artist_id="benny")
    sheet = page.locator(".sheet")
    assert "New Lead" in sheet.inner_text()
    page.once("dialog", lambda d: d.accept())
    sheet.locator('[data-testid="confirm-lead"]').click()
    page.wait_for_function("() => S.events.some(e => e.clientName === 'Test Harness Confirm Lead' && e.status === 'booked' && !e.depositReceived)", timeout=10000)
    assert sheet.locator('[data-testid="confirm-lead"]').count() == 0
    assert "Booked" in sheet.inner_text()
    assert not errors, f"console errors: {errors}"
