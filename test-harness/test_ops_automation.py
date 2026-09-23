"""
Ops automation project (2026-09-22/23): permanent regression coverage for the features shipped
during the "go until all phases are done" push. Earlier verification of these was ad-hoc Playwright
scripts run and discarded, not committed tests -- this file closes that gap for the highest-value
pieces (the ones with real, clickable state to assert against; the several OAuth-scaffolding-only
phases have no real flow to test until real credentials exist).

All admin-only, so these run as admin_bookings like test_core_flows.py.
"""
from helpers import login_as, goto_nav, collect_console_errors


def test_external_event_detail_fields_and_reminder_persist(live_server, page):
    """
    Outside Bookings/External Events (Phase 2 part 1): the basic creation modal makes a booking,
    then the richer External Events fields (event name, reminders) live on the detail sheet opened
    from the list -- asserts a reminder added there survives a full page reload.
    """
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "outside_bookings")

    page.locator('[data-action="open-new-outside-booking"]').click()
    modal = page.locator('.modal').last
    modal.locator('input[data-field="performerName"]').fill("Test Harness Outside Act")
    modal.locator('input[data-field="clientName"]').fill("Test Harness Venue")
    modal.locator('input[data-field="date"]').fill("2027-05-01")
    modal.locator('input[data-field="totalAmount"]').fill("3000")
    modal.locator('input[data-field="aspCut"]').fill("400")
    modal.locator('[data-action="submit-outside-booking"]').click()
    page.wait_for_timeout(400)

    page.locator('tr.row-link').first.click()
    detail = page.locator('.sheet').last
    detail.locator('input[data-outside-field="top.eventName"]').fill("Persisted Event Name")
    detail.locator('[data-action="add-outside-booking-reminder"]').click()
    page.wait_for_timeout(300)
    detail.locator('button.btn-block[data-action="close-outside-booking-detail"]').click()
    page.wait_for_timeout(300)

    row_text = page.locator('tbody tr').first.inner_text()
    assert "Persisted Event Name" in row_text, "event name didn't save onto the outside booking"
    assert "1 due" in row_text, "reminders-due badge didn't show after adding a reminder"

    page.reload()
    login_as(page, "admin_bookings")
    goto_nav(page, "outside_bookings")
    row_text_after_reload = page.locator('tbody tr').first.inner_text()
    assert "Persisted Event Name" in row_text_after_reload, "event name didn't survive a reload"
    assert "1 due" in row_text_after_reload, "reminder didn't survive a reload"
    assert not errors, f"console errors during external event flow: {errors}"


def test_multi_artist_lead_roster_and_multiline_contract_prefill(live_server, page):
    """
    Phase 2 part 2: New Lead's "Additional ASP Artists" section creates ev.additionalArtists, shown
    admin-only on the event detail roster; creating a contract from that lead pre-fills one
    Multi-Line Package line item per artist.
    """
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    page.locator('[data-action="open-new-lead"]').click()
    modal = page.locator('.modal').last
    modal.locator('[data-action="pick-artist"][data-id="baruch"]').click()
    modal.locator('[data-action="toggle-additional-artist"][data-id="eli"]').click()
    modal.locator('input[data-lead-artist-fee="eli"]').fill("1500")
    modal.locator('input[data-field="clientName"]').fill("Multi Artist Test Client")
    modal.locator('input[data-field="date"]').fill("2027-06-01")
    modal.locator('input[data-field="price"]').fill("5000")
    modal.locator('[data-action="submit-lead"]').click()
    page.wait_for_timeout(400)

    sheet = page.locator('.sheet').last
    sheet_text = sheet.inner_text()
    assert "Eli Marcus" in sheet_text, "additional artist not shown in the roster on event detail"
    assert "1,500" in sheet_text, "additional artist's fee not shown in the roster"

    sheet.locator('[data-action="create-contract"]').click()
    page.wait_for_timeout(300)
    picker = page.locator('.modal', has_text="Choose a Contract Template")
    assert "2 artists" in picker.inner_text(), "template picker should hint at the multi-artist lead"
    picker.locator('[data-action="pick-template-create"][data-template="multiline"]').click()
    page.wait_for_timeout(300)

    # doCreateContractFromLead() opens the Contract Builder sheet on top of the still-open event
    # sheet (same layering as the event/travel-request stack elsewhere) -- both now mention the
    # template name (the event sheet via its own contract-list entry), so .last (the most recently
    # appended, topmost sheet) is the reliable way to grab the actual builder, not a text filter.
    builder = page.locator('.sheet').last
    line_items_text = builder.inner_text()
    assert "Baruch Levine" in line_items_text, "primary artist not pre-filled as a line item"
    assert "Eli Marcus" in line_items_text, "additional artist not pre-filled as a line item"
    assert not errors, f"console errors during multi-artist lead flow: {errors}"


def test_travel_request_send_gated_on_rivky_email(live_server, page):
    """
    Phase 7: Send to Rivky stays disabled until her email is configured in Settings (org-wide,
    never hardcoded), and becomes enabled once it is.
    """
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    page.locator('[data-action="open-new-lead"]').click()
    modal = page.locator('.modal').last
    modal.locator('[data-action="pick-artist"][data-id="moshe"]').click()
    modal.locator('input[data-field="clientName"]').fill("Travel Test Client")
    modal.locator('input[data-field="date"]').fill("2027-07-01")
    modal.locator('input[data-field="price"]').fill("4000")
    modal.locator('#flightck').click()
    modal.locator('[data-action="submit-lead"]').click()
    page.wait_for_timeout(400)

    page.locator('.sheet').last.locator('[data-action="create-travel-request"]').click()
    page.wait_for_timeout(400)
    # Once the request exists, the underlying event sheet ALSO shows a "Travel Request" summary
    # button (renderTravelRequestSummary), so a plain has_text="Travel Request" match is ambiguous
    # between the two stacked overlays -- filter by containing the Send button instead, which only
    # ever exists on the actual detail sheet.
    send_btn = page.locator('.overlay').filter(has=page.locator('[data-action="send-travel-request"]')).locator('[data-action="send-travel-request"]')
    assert send_btn.is_disabled(), "Send to Rivky should be disabled with no Rivky email configured"
    page.locator('.overlay').filter(has=page.locator('[data-action="close-travel-request-detail"]')).locator('[data-action="close-travel-request-detail"]').click()
    page.wait_for_timeout(200)
    page.locator('.sheet [data-action="close-sheet"]').first.click()  # close the underlying event sheet too
    page.wait_for_timeout(200)

    goto_nav(page, "settings")
    page.locator('input[data-field="rivkyEmail"]').fill("rivky@travelbooker.com")
    page.wait_for_timeout(200)

    goto_nav(page, "leads")
    page.get_by_text("Travel Test Client").first.click()
    page.wait_for_timeout(300)
    page.locator('.sheet').last.locator('[data-action="open-travel-request"]').click()
    page.wait_for_timeout(300)
    send_btn2 = page.locator('.overlay').filter(has=page.locator('[data-action="send-travel-request"]')).locator('[data-action="send-travel-request"]')
    assert send_btn2.is_enabled(), "Send to Rivky should enable once her email is configured"
    assert not errors, f"console errors during travel request flow: {errors}"


def test_payee_profile_zelle_fields_present(live_server, page):
    """Phase 6 part 1: the Zelle QR fields exist on the payee profile form and save."""
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "settings")

    page.locator('[data-action="open-payee-profile-form"]').first.click()
    modal = page.locator('.modal', has_text="Payee Profile")
    assert modal.locator('input[data-field="zelleRecipientLabel"]').count() == 1
    assert modal.locator('#zelleActiveCk').count() == 1
    assert modal.locator('[data-action="upload-payee-zelle-qr"]').count() == 1
    modal.locator('input[data-field="zelleRecipientLabel"]').fill("Test Harness Zelle Label")
    modal.locator('[data-action="save-payee-profile"]').click()
    page.wait_for_timeout(300)
    assert not errors, f"console errors during payee profile Zelle flow: {errors}"
