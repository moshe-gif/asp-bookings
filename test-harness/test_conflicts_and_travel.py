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


def test_travel_confirmations_build_itinerary(live_server, page):
    """Travel drop-in: parse-travel-docs is stubbed (no paid AI call). Pasted confirmations -> the list ->
    Save fills the gig's flight + driver and the ASP itinerary shows every flight, hotel and car."""
    import json as _json
    errors = collect_console_errors(page)
    travel = {"flights": [{"passenger": "Benny Friedman", "airline": "Delta", "flightNumber": "DL1234", "confirmation": "ABC123",
                           "departAirport": "JFK", "arriveAirport": "MIA", "departAt": "2027-12-01T08:00", "arriveAt": "2027-12-01T11:05", "cabin": "Business", "seat": "2A"},
                          {"passenger": "Benny Friedman", "airline": "Delta", "flightNumber": "DL4321", "confirmation": "ABC123",
                           "departAirport": "MIA", "arriveAirport": "JFK", "departAt": "2027-12-02T13:00", "arriveAt": "2027-12-02T16:10", "cabin": "", "seat": ""}],
              "hotels": [{"name": "Test Bay Hotel", "address": "1 Ocean Dr, Miami", "phone": "", "checkIn": "2027-12-01", "checkOut": "2027-12-02", "confirmation": "H778", "guest": ""}],
              "ground": [{"company": "Test Cars", "driver": "Sam", "phone": "555-0199", "pickupAt": "2027-12-01T11:30", "pickupLocation": "MIA arrivals", "dropoffLocation": "Test Bay Hotel", "confirmation": ""}],
              "notes": "Bring passport"}
    page.route("**/functions/v1/parse-travel-docs", lambda route: route.fulfill(
        status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"},
        body=_json.dumps({"ok": True, "travel": travel})))
    seed_events(page, [fake_gig("EV-9701", "benny", "2027-12-01", clientName="Itinerary Client", flightNeeded=True, city="Miami", state="FL")])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "leads")
    page.locator('[data-action="open-event"][data-id="EV-9701"]').first.click()
    page.locator('.sheet [data-action="open-travel-drop"]').first.click()
    page.locator('[data-form="traveldrop"] textarea[data-field="text"]').fill("Delta DL1234 JFK-MIA ... Test Bay Hotel ...")
    page.locator('[data-action="read-travel-docs"]').click()
    page.locator('[data-action="save-travel-docs"]').click()
    sheet = page.locator(".sheet").first.inner_text()
    assert "Flight booked" in sheet and "Driver booked" in sheet, "flight/driver cards not filled from the confirmations"
    page.locator('.sheet [data-action="view-itinerary"]').click()
    doc = page.locator("#itineraryPrintHost .doc").inner_text()
    for want in ("TRAVEL ITINERARY", "DL1234", "DL4321", "Test Bay Hotel", "Test Cars", "Bring passport"):
        assert want in doc, f"itinerary is missing {want!r}"
    assert not errors, f"console errors: {errors}"


def test_new_lead_mezumin_marks_cash(live_server, page):
    """New Lead 'Mezumin (cash)' button (owner 2026-10-14) saves the lead with the cash payment method."""
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.locator('[data-action="open-new-lead"]').click()
    page.locator('[data-action="pick-artist"][data-id="benny"]').click()
    page.locator('input[data-field="clientName"]').fill("Mezumin Client")
    page.locator('input[data-field="date"]').fill("2027-08-08")
    page.locator('[data-action="toggle-lead-mezumin"]').click()
    page.locator('[data-action="submit-lead"]').click()
    assert "Mezumin (cash)" in page.locator(".sheet").first.inner_text(), "lead isn't marked Mezumin (cash)"
    assert not errors, f"console errors: {errors}"


def test_add_fee_and_additional_fee_on_gig(live_server, page):
    """Owner 2026-10-14: set the artist's fee on a gig created without one, then add an additional fee."""
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    create_lead(page, "No Fee Yet Client", "2027-10-20", artist_id="benny")
    sheet = page.locator(".sheet").first
    sheet.locator('[data-action="edit-gig-fee"]').click()
    sheet.locator('[data-form="gigfee"] input[data-field="price"]').fill("5000")
    sheet.locator('[data-action="save-gig-fee"]').click()
    text = page.locator(".sheet").first.inner_text()
    assert "$5,000" in text, "fee not shown after Add fee"
    page.locator('.sheet [data-action="toggle-add-charge"]').click()
    page.locator('.sheet input[data-field="amount"]').fill("300")
    page.locator('.sheet [data-action="confirm-add-charge"]').click()
    assert "$5,300" in page.locator(".sheet").first.inner_text(), "additional fee not added to the client total"
    assert not errors, f"console errors: {errors}"


def test_flight_form_fills_from_confirmation_file(live_server, page):
    """Flight Info 'Fill from PDF / photo' (owner 2026-10-15): parse-travel-docs is stubbed; the form fills."""
    import json as _json
    errors = collect_console_errors(page)
    travel = {"flights": [{"passenger": "", "airline": "Delta", "flightNumber": "DL 1234", "confirmation": "CNF777", "departAirport": "JFK", "arriveAirport": "MIA",
                           "departAt": "2027-12-01T08:00", "arriveAt": "2027-12-01T11:05", "cabin": "", "seat": ""}], "hotels": [], "ground": [], "notes": ""}
    page.route("**/functions/v1/parse-travel-docs", lambda route: route.fulfill(
        status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}, body=_json.dumps({"ok": True, "travel": travel})))
    seed_events(page, [fake_gig("EV-9801", "benny", "2027-12-01", clientName="Flight Form Client", flightNeeded=True)])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "leads")
    page.locator('[data-action="open-event"][data-id="EV-9801"]').first.click()
    page.locator('.sheet [data-action="open-flight-form"]').first.click()
    page.locator('input[data-action="flight-form-file"]').set_input_files({"name": "conf.pdf", "mimeType": "application/pdf", "buffer": b"%PDF-1.4 test"})
    page.wait_for_function("() => document.querySelector('[data-form=\"flight\"] input[data-field=\"flightNumber\"]')?.value === 'DL1234'", timeout=10000)
    assert page.locator('[data-form="flight"] input[data-field="confirmation"]').input_value() == "CNF777"
    assert not errors, f"console errors: {errors}"


def test_inbox_lists_emails_and_actions_open_the_right_form(live_server, page):
    """Inbox (owner 2026-10-15): inbox_items is stubbed with fake rows (no real email); each item's action
    opens the matching form prefilled, and Dismiss removes it. Payment items only open Verify Deposit."""
    import json as _json
    errors = collect_console_errors(page)
    items = [
        {"id": "11111111-1111-1111-1111-111111111111", "gmail_message_id": "m1", "gmail_thread_id": "t1", "received_at": "2026-10-15T15:00:00Z",
         "from_addr": "Band Office <band@example.com>", "subject": "Lineup for Sunday", "snippet": "", "kind": "gig_info",
         "summary": "Test Inbox Band sent the lineup.", "event_legacy_id": "EV-9901", "match_note": "", "status": "new",
         "extracted": {"band": "Test Inbox Band", "bandSize": "7", "songs": [{"moment": "Chuppah", "song": "Mi Adir"}]}},
        {"id": "22222222-2222-2222-2222-222222222222", "gmail_message_id": "m2", "gmail_thread_id": "t2", "received_at": "2026-10-15T14:00:00Z",
         "from_addr": "New Client <new@example.com>", "subject": "Booking request", "snippet": "", "kind": "booking_inquiry",
         "summary": "Inquiry for a wedding.", "event_legacy_id": None, "match_note": "", "status": "new",
         "extracted": {"clientName": "Inbox Inquiry Client", "date": "2027-11-11", "type": "Wedding", "artistName": "Benny Friedman"}},
    ]
    def handle(route):
        if route.request.method == "GET":
            route.fulfill(status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}, body=_json.dumps(items))
        else:
            route.fulfill(status=204, headers={"Access-Control-Allow-Origin": "*"}, body="")
    page.route("**/rest/v1/inbox_items*", handle)
    seed_events(page, [fake_gig("EV-9901", "benny", "2027-10-31", clientName="Inbox Gig Client")])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "messages")
    page.locator('[data-testid="inbox-item"]').first.wait_for(state="visible")
    assert page.locator('[data-testid="inbox-item"]').count() == 2
    page.locator('[data-action="inbox-act"][data-id="11111111-1111-1111-1111-111111111111"]').click()
    assert page.locator('input[data-field="band"]').input_value() == "Test Inbox Band", "gig sheet form not prefilled from the email"
    page.locator('[data-action="close-giginfo-form"]').click()
    page.locator('.sheet [data-action="close-sheet"]').first.click()
    goto_nav(page, "messages")
    page.locator('[data-action="inbox-act"][data-id="22222222-2222-2222-2222-222222222222"]').click()
    assert page.locator('input[data-field="clientName"]').input_value() == "Inbox Inquiry Client", "New Lead not prefilled from the inquiry"
    page.locator('[data-action="close-sheet"]').first.click()
    goto_nav(page, "messages")
    page.locator('[data-action="inbox-dismiss"][data-id="22222222-2222-2222-2222-222222222222"]').click()
    page.wait_for_function("() => document.querySelectorAll('[data-testid=\"inbox-item\"]').length === 1", timeout=10000)
    assert not errors, f"console errors: {errors}"


def test_inbox_money_in_records_payments(live_server, page):
    """Money in (owner 2026-10-21): a payment email matched to a gig's deposit is recorded with one click
    (deposit received, lead booked), and a bank's own alert for exactly the balance due is recorded on its
    own. inbox_items is stubbed (no real email); the claim (money_applied_at) answers for one browser."""
    import json as _json
    errors = collect_console_errors(page)
    items = [
        {"id": "33333333-3333-3333-3333-333333333333", "mailbox_email": "office@aspmgmt.com", "gmail_message_id": "m3", "gmail_thread_id": "t3",
         "received_at": "2026-10-20T15:00:00Z", "from_addr": "Client <client@example.com>", "subject": "Sent the deposit", "snippet": "",
         "kind": "payment_notice", "summary": "Client says the deposit was sent by Zelle.", "event_legacy_id": "EV-9902", "match_note": "", "status": "new",
         "extracted": {}, "money_applied_at": None,
         "money": {"amount_cents": 150000, "payer": "Money Test Client", "method": "Zelle", "date": "2026-10-20", "memo": "", "bank_verified": False, "bank": None,
                   "match": {"kind": "deposit", "ref": "EV-9902", "due_cents": 150000, "exact": True}}},
        {"id": "44444444-4444-4444-4444-444444444444", "mailbox_email": "pay@example.com", "gmail_message_id": "m4", "gmail_thread_id": "t4",
         "received_at": "2026-10-21T15:00:00Z", "from_addr": "Chase <no.reply.alerts@chase.com>", "subject": "You received money with Zelle", "snippet": "",
         "kind": "payment_notice", "summary": "Zelle received for the balance.", "event_legacy_id": "EV-9903", "match_note": "", "status": "new",
         "extracted": {}, "money_applied_at": None,
         "money": {"amount_cents": 850000, "payer": "Balance Test Client", "method": "Zelle", "date": "2026-10-21", "memo": "", "bank_verified": True, "bank": "chase.com",
                   "match": {"kind": "balance", "ref": "EV-9903", "due_cents": 850000, "exact": True}}},
    ]
    def handle(route):
        cors = {"Access-Control-Allow-Origin": "*"}
        if route.request.method == "GET":
            route.fulfill(status=200, content_type="application/json", headers=cors, body=_json.dumps(items))
        else:   # the claim: this browser wins it
            route.fulfill(status=200, content_type="application/json", headers=cors, body=_json.dumps([{"id": "x"}]))
    page.route("**/rest/v1/inbox_items*", handle)
    seed_events(page, [fake_gig("EV-9902", "benny", "2027-10-31", clientName="Money Test Client", status="contract_sent", depositReceived=False),
                       fake_gig("EV-9903", "benny", "2027-11-07", clientName="Balance Test Client", status="booked", depositReceived=True, balanceReceived=False)])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "messages")
    page.locator('[data-action="inbox-money"][data-id="33333333-3333-3333-3333-333333333333"]').click()
    page.wait_for_function("() => { const e = JSON.parse(localStorage.getItem('asp_mock_state_v3')||'[]').find(x => x.id === 'EV-9902'); return e && e.depositReceived && e.status === 'booked'; }", timeout=10000)
    ev = page.evaluate("() => JSON.parse(localStorage.getItem('asp_mock_state_v3')||'[]').find(x => x.id === 'EV-9902')")
    assert ev["depositVerification"]["method"] == "zelle" and ev["depositReceivedDate"] == "2026-10-20", ev.get("depositVerification")
    # The Chase alert for exactly the balance is recorded with nobody clicking.
    page.wait_for_function("() => { const e = JSON.parse(localStorage.getItem('asp_mock_state_v3')||'[]').find(x => x.id === 'EV-9903'); return e && e.balanceReceived && e.status === 'paid'; }", timeout=20000)
    assert not errors, f"console errors: {errors}"


def test_venue_pick_fills_address(live_server, page):
    """Venue list (owner 2026-10-15): picking a known venue on New Lead fills address/city/state; the gig keeps them."""
    import json as _json
    errors = collect_console_errors(page)
    venues = [{"name": "Test Venue Hall", "address": "1 Test Ave", "city": "Lakewood", "state": "NJ", "zip": "08701"}]
    page.context.add_init_script(f"localStorage.setItem('asp_mock_venues_v1', {_json.dumps(_json.dumps(venues))});")
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.locator('[data-action="open-new-lead"]').click()
    page.locator('[data-action="pick-artist"][data-id="benny"]').click()
    page.locator('input[data-field="clientName"]').fill("Venue Pick Client")
    page.locator('input[data-field="date"]').fill("2027-06-06")
    page.locator('input[data-field="venue"]').fill("Test Venue Hall")
    assert page.locator('input[data-field="address"]').input_value() == "1 Test Ave"
    assert page.locator('input[data-field="city"]').input_value() == "Lakewood"
    assert page.locator('input[data-field="state"]').input_value() == "NJ"
    page.locator('[data-action="submit-lead"]').click()
    ev = page.evaluate("() => JSON.parse(localStorage.getItem('asp_mock_state_v3')||'[]').find(e => e.clientName === 'Venue Pick Client')")
    assert ev and ev["address"] == "1 Test Ave" and ev["city"] == "Lakewood", f"gig didn't keep the venue address: {ev and ev.get('address')}"
    assert not errors, f"console errors: {errors}"


DROP_PDF_JS = """(sel) => {
    const dt = new DataTransfer();
    dt.items.add(new File(['%PDF-1.4 test'], 'confirmation.pdf', { type: 'application/pdf' }));
    const zone = document.querySelector(sel);
    zone.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true }));
    zone.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}"""


def test_drag_and_drop_flight_and_travel_pdfs(live_server, page):
    """Drag and drop (owner 2026-10-29: "for flight info and hotel itinerary i want a drag and drop option for
    pdf"): a PDF dropped on Flight Info fills the form; dropped on Travel Confirmations it is read at once and
    the hotel is listed to save. parse-travel-docs is stubbed (fake data)."""
    import json as _json
    errors = collect_console_errors(page)
    travel = {"flights": [{"passenger": "", "airline": "Delta", "flightNumber": "DL 4321", "confirmation": "CNF888", "departAirport": "JFK", "arriveAirport": "MIA",
                           "departAt": "2027-12-02T08:00", "arriveAt": "2027-12-02T11:05", "cabin": "", "seat": ""}],
              "hotels": [{"name": "Harness Test Hotel", "checkIn": "2027-12-02", "checkOut": "2027-12-03", "confirmation": "H123", "address": "1 Test Way"}], "ground": [], "notes": ""}
    page.route("**/functions/v1/parse-travel-docs", lambda route: route.fulfill(
        status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}, body=_json.dumps({"ok": True, "travel": travel})))
    seed_events(page, [fake_gig("EV-9802", "benny", "2027-12-02", clientName="Drop Test Client", flightNeeded=True)])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "leads")
    page.locator('[data-action="open-event"][data-id="EV-9802"]').first.click()
    page.locator('.sheet [data-action="open-flight-form"]').first.click()
    page.evaluate(DROP_PDF_JS, '[data-testid="flight-drop"]')
    page.wait_for_function("() => document.querySelector('[data-form=\"flight\"] input[data-field=\"flightNumber\"]')?.value === 'DL4321'", timeout=10000)
    page.locator('[data-action="close-flight-form"]').click()
    page.locator('.sheet [data-action="open-travel-drop"]').first.click()
    page.evaluate(DROP_PDF_JS, '[data-testid="travel-drop"]')
    page.locator('[data-form="traveldrop"]', has_text="Harness Test Hotel").wait_for(state="visible", timeout=10000)
    assert page.locator('[data-form="traveldrop"] [data-action="save-travel-docs"]').count() == 1
    assert not errors, f"console errors: {errors}"
