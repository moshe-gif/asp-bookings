"""
Scheduling conflicts compare times, not just dates (owner 2026-10-13), and "flight / ground
transport needed" can be undone from the gig sheet. Locally seeded gigs only (no shared sync).
"""
from helpers import login_as, goto_nav, collect_console_errors, fake_gig, seed_events, create_lead

GIGS = [
    # same day, no overlap: morning vs evening
    fake_gig("EV-9301", "benny", "2027-07-01", time="10:00", endTime="12:00", clientName="Morning Bris"),
    fake_gig("EV-9302", "benny", "2027-07-01", time="19:00", endTime="23:00", clientName="Evening Wedding"),
    # same day, overlapping
    fake_gig("EV-9303", "benny", "2027-07-02", time="19:00", endTime="22:00", clientName="Overlap One"),
    fake_gig("EV-9304", "benny", "2027-07-02", time="21:00", endTime="23:30", clientName="Overlap Two"),
    # travel flags to undo
    fake_gig("EV-9305", "benny", "2027-07-10", flightNeeded=True, groundTransportNeeded=True, clientName="Travel Gig"),
]


def test_conflicts_need_overlapping_times(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, GIGS)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "dashboard")
    body = page.locator("#app").inner_text()
    assert "Overlap One" in body and "Overlap Two" in body, "overlapping times not flagged as a conflict"
    assert "Scheduling conflicts (1)" in body, "same-day gigs at different times were flagged as conflicts"
    assert not errors, f"console errors: {errors}"


def test_flight_and_transport_can_be_unmarked(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, GIGS)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "leads")
    page.locator('[data-action="open-event"][data-id="EV-9305"]').first.click()
    sheet = page.locator(".sheet")
    sheet.locator('[data-action="unmark-flight"]').click()
    assert sheet.locator('[data-action="toggle-flight"]').count() == 1, "flight still marked needed"
    sheet.locator('[data-action="unmark-ground-transport"]').click()
    assert sheet.locator('[data-action="toggle-ground-transport"]').count() == 1, "ground transport still marked needed"
    assert "Marked: no flight needed." in sheet.inner_text()
    assert not errors, f"console errors: {errors}"


def test_wedding_contract_skips_template_picker(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    create_lead(page, "Picker Skip Wedding", "2027-09-09", artist_id="benny")
    page.locator('[data-action="create-contract"]').click()
    page.locator('#contractBuilderOverlayHost .sheet').wait_for(state="visible")
    assert page.locator('#templatePickerOverlayHost').count() == 0, "one-artist wedding still showed the template picker"
    assert "Standard Artist Agreement" in page.locator('#contractBuilderOverlayHost').inner_text()
    assert not errors, f"console errors: {errors}"


def test_new_lead_end_time_autofills_and_time_tbd(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.locator('[data-action="open-new-lead"]').click()
    page.locator('[data-action="pick-artist"][data-id="benny"]').click()
    end = page.locator('input[data-field="endTime"]')
    assert end.input_value(), "end time not prefilled"
    first = end.input_value()
    page.locator('input[data-field="time"]').fill("18:00")
    assert end.input_value() and end.input_value() != first, "end time didn't follow the start time"
    page.locator('input[data-field="timeTbd"]').check()
    assert page.locator('input[data-field="time"]').count() == 0, "time fields still shown with Time TBD"
    page.locator('input[data-field="clientName"]').fill("TBD Time Client")
    page.locator('input[data-field="date"]').fill("2027-09-10")
    page.locator('[data-action="submit-lead"]').click()
    assert "Time TBD" in page.locator(".sheet").inner_text(), "lead saved with a time despite Time TBD"
    assert not errors, f"console errors: {errors}"


def test_paste_message_fills_new_lead(live_server, page):
    """The parse-lead function's reply is stubbed here so the harness never calls the paid AI API;
    this checks the New Lead wiring: paste -> Fill from message -> fields filled -> notes kept on the lead."""
    import json as _json
    errors = collect_console_errors(page)
    fields = {"clientName": "Paste Test Client", "clientEmail": "paste@example.com", "clientPhone": "555-0100",
              "date": "2027-12-15", "time": "", "endTime": "", "type": "Wedding", "artistName": "Benny Friedman",
              "venue": "Test Paste Hall", "city": "Lakewood", "state": "NJ", "price": "4500", "notes": "Band is TBD"}
    page.route("**/functions/v1/parse-lead", lambda route: route.fulfill(
        status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"},
        body=_json.dumps({"ok": True, "fields": fields})))
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.locator('[data-action="open-new-lead"]').click()
    page.locator('textarea[data-field="pasteText"]').fill("Paste Test Client\nDecember 15\npaste@example.com\nTest Paste Hall, lakewood\n4500\nWedding")
    page.locator('[data-action="parse-lead-paste"]').click()
    page.wait_for_function("() => document.querySelector('input[data-field=\"clientName\"]')?.value === 'Paste Test Client'", timeout=10000)
    assert page.locator('input[data-field="venue"]').input_value() == "Test Paste Hall"
    assert page.locator('input[data-field="date"]').input_value() == "2027-12-15"
    assert page.locator('[data-action="pick-artist"][data-id="benny"]').get_attribute("class").count("sel") == 1
    page.locator('[data-action="submit-lead"]').click()
    assert "From the pasted message: Band is TBD" in page.locator(".sheet").inner_text()
    assert not errors, f"console errors: {errors}"
