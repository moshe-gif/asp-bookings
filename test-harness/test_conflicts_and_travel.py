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


def test_standard_contract_defaults(live_server, page):
    """Owner 2026-10-14: 15% deposit, Mechitza always, travel only when the gig needs a flight,
    and the artist side comes pre-signed."""
    errors = collect_console_errors(page)
    seed_events(page, [fake_gig("EV-9501", "eli", "2027-11-11", status="lead", clientName="Defaults Local"),
                       fake_gig("EV-9502", "eli", "2027-11-12", status="lead", clientName="Defaults Flight", flightNeeded=True)])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    texts = {}
    for gid in ("EV-9501", "EV-9502"):
        goto_nav(page, "leads")
        page.locator(f'[data-action="open-event"][data-id="{gid}"]').first.click()
        page.locator('.sheet [data-action="create-contract"]').first.click()
        page.locator('#contractBuilderOverlayHost .sheet').wait_for(state="visible")
        page.locator('[data-action="view-contract-builder-doc"]').first.click()
        texts[gid] = page.locator('#contractBuilderPrintHost .doc').inner_text()
        assert page.locator('#contractBuilderPrintHost .doc-signature').count() == 1, "artist side not pre-signed"
        page.locator('[data-action="close-contract-builder-doc"]').click()
        page.locator('#contractBuilderOverlayHost [data-action="close-contract-builder"]').first.click()
        page.locator('.sheet [data-action="close-sheet"]').first.click()
    local, flight = texts["EV-9501"], texts["EV-9502"]
    assert "(15%)" in local, "standard deposit isn't 15%"
    assert "Eli Marcus only performs at events where there is a Mechitza." in local
    assert "plus travel expenses" not in local and "Business Class" not in local, "travel on a gig that needs no flight"
    assert "plus travel expenses" in flight and "Business Class flight and Hotel" in flight
    assert not errors, f"console errors: {errors}"


def test_flight_needed_creates_travel_request(live_server, page):
    """Marking flight needed creates the gig's travel request at once (it emails Rivky when her
    address is set in Settings; the harness never has it, so nothing is sent here)."""
    errors = collect_console_errors(page)
    seed_events(page, [fake_gig("EV-9503", "benny", "2027-10-10", clientName="Auto Travel Gig")])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "leads")
    page.locator('[data-action="open-event"][data-id="EV-9503"]').first.click()
    page.locator('.sheet [data-action="toggle-flight"]').click()
    page.wait_for_timeout(500)
    n = page.evaluate("() => JSON.parse(localStorage.getItem('asp_mock_travel_requests_v1') || '[]').filter(t => t.eventId === 'EV-9503').length")
    assert n == 1, f"expected one travel request for the gig, found {n}"
    assert not errors, f"console errors: {errors}"


def test_gig_info_drop_in_builds_sheet(live_server, page):
    """Gig Info drop-in: the parse-gig-info reply is stubbed (no paid AI call); the form fills, saves,
    and the card + ASP gig sheet show the lineup, run of the night and songs."""
    import json as _json
    errors = collect_console_errors(page)
    sheet = {"band": "Test Band Orchestra", "bandSize": "8", "choir": "Test Choir", "otherSingers": ["Guest Singer"],
             "startTime": "19:30", "schedule": [{"time": "18:30", "item": "Kabbalas Panim"}, {"time": "19:15", "item": "Chuppah"}],
             "songs": [{"moment": "Chuppah walk", "song": "Mi Adir"}],
             "contacts": [{"name": "Band Leader", "role": "Bandleader", "phone": "555-0101", "email": ""}], "notes": "Black suit"}
    page.route("**/functions/v1/parse-gig-info", lambda route: route.fulfill(
        status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"},
        body=_json.dumps({"ok": True, "sheet": sheet})))
    seed_events(page, [fake_gig("EV-9601", "benny", "2027-09-20", clientName="Gig Sheet Client")])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "leads")
    page.locator('[data-action="open-event"][data-id="EV-9601"]').first.click()
    page.locator('.sheet [data-action="open-giginfo-form"]').click()
    page.locator('textarea[data-field="dropText"]').fill("Band: Test Band Orchestra, 8 piece. Chuppah 7:15 Mi Adir")
    page.locator('[data-action="build-gig-sheet"]').click()
    page.wait_for_function("() => document.querySelector('input[data-field=\"band\"]')?.value === 'Test Band Orchestra'", timeout=10000)
    page.locator('[data-action="save-giginfo"]').click()
    card = page.locator(".sheet").first.inner_text()
    for want in ("Test Band Orchestra (8 pieces)", "Test Choir", "Guest Singer", "Kabbalas Panim", "Mi Adir", "Band Leader"):
        assert want in card, f"gig info card is missing {want!r}"
    page.locator('.sheet [data-action="view-giginfo"]').click()
    doc = page.locator("#gigInfoPrintHost .doc").inner_text()
    assert "GIG SHEET" in doc and "Run of the night".upper() in doc.upper() and "Mi Adir" in doc
    assert not errors, f"console errors: {errors}"
