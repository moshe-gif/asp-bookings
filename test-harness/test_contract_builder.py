"""
Contract Builder: the clause-driven, persisted contract system reached from a lead's detail
sheet (separate from the existing simple per-event auto-doc "Contracts" page, which this feature
does not touch). Covers the acceptance criteria directly: autofill from the lead, two artists
with distinct flight clauses, flight + hotel structured clauses rendering correct sentences,
live discount/down-payment math, brand switching, and reload persistence.
"""
from helpers import login_as, goto_nav, collect_console_errors


def create_lead(page, client_name, date, artist_id="benny"):
    page.locator('[data-action="open-new-lead"]').click()
    page.locator(f'[data-action="pick-artist"][data-id="{artist_id}"]').click()
    page.locator('input[data-field="clientName"]').fill(client_name)
    page.locator('input[data-field="date"]').fill(date)
    page.locator('[data-action="submit-lead"]').click()


def open_contract_builder_from_lead(page):
    page.locator('[data-action="create-contract"]').click()
    builder = page.locator('#contractBuilderOverlayHost .sheet')
    builder.wait_for(state='visible')
    return builder


def test_create_contract_autofills_from_lead(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "Contract Autofill Client", "2027-08-20")
    builder = open_contract_builder_from_lead(page)

    assert builder.locator('input[data-contract-field="snapshot.clientName"]').input_value() == "Contract Autofill Client"
    assert builder.locator('input[data-contract-field="snapshot.eventDate"]').input_value() == "2027-08-20"
    # Every autofilled field stays editable -- prove it by changing one and re-reading it back.
    name_field = builder.locator('input[data-contract-field="snapshot.clientName"]')
    name_field.fill("Edited Client Name")
    name_field.blur()
    assert name_field.input_value() == "Edited Client Name"

    assert not errors, f"console errors during contract autofill: {errors}"


def test_two_artists_distinct_flight_clauses_and_hotel_clauses(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "Multi Artist Client", "2027-09-10")
    builder = open_contract_builder_from_lead(page)

    # Add a second artist to the contract.
    builder.locator('[data-action="add-contract-artist"]').click()
    artist_selects = builder.locator('.contract-artist-select')
    assert artist_selects.count() == 2, "adding an artist row did not produce a second artist select"
    artist_selects.nth(1).select_option("yaakov")

    # Resolve display names from the ARTISTS roster via the option labels already rendered.
    singer1_name = artist_selects.nth(0).locator('option[value="benny"]').text_content()
    singer2_name = artist_selects.nth(1).locator('option[value="yaakov"]').text_content()

    # Add the structured Flights clause, then build up three entries: one business-class flight
    # each for the two singers, plus a shared economy block for the band.
    builder.locator('[data-action="toggle-add-clause-picker"]').click()
    builder.locator('[data-action="add-contract-clause"]', has_text="Flights").click()

    def set_entry(idx, artist_value, provider, cabin_class, count):
        selects = builder.locator('.contract-entry-select[data-field="artistId"]')
        selects.nth(idx).select_option(artist_value)
        builder.locator('.contract-entry-select[data-field="provider"]').nth(idx).select_option(provider)
        builder.locator('.contract-entry-select[data-field="cabinClass"]').nth(idx).select_option(cabin_class)
        count_input = builder.locator('.contract-entry-number[data-field="count"]').nth(idx)
        count_input.fill(str(count))
        count_input.blur()

    # A new structured clause starts with zero entries -- click "Add Flight" before each one.
    add_flight = builder.locator('[data-action="add-clause-entry"]').first
    add_flight.click()
    set_entry(0, "benny", "client", "business", 1)
    add_flight.click()
    set_entry(1, "yaakov", "client", "business", 1)
    add_flight.click()
    set_entry(2, "", "client", "economy", 6)

    # The Flights clause is the one just added -> appended to the end of the clause list (the
    # lead's default clause set is plain-text and comes first).
    sentence = builder.locator('textarea[data-contract-field^="clause."][data-contract-field$=".bodyText"]').last.input_value()
    assert f"one (1) business class flight for {singer1_name}" in sentence, sentence
    assert f"one (1) business class flight for {singer2_name}" in sentence, sentence
    assert "six (6) economy class flights for the band" in sentence, sentence

    # Hotel clauses: one premium instance, one standard instance -- each its own generated
    # sentence. Each new structured clause starts with zero entries too.
    builder.locator('[data-action="toggle-add-clause-picker"]').click()
    builder.locator('[data-action="add-contract-clause"]', has_text="Hotel").click()
    builder.locator('[data-action="add-clause-entry"]').last.click()
    hotel_tier_selects = builder.locator('.contract-entry-select[data-field="tier"]')
    hotel_tier_selects.first.select_option("premium")
    hotel_rooms = builder.locator('.contract-entry-number[data-field="rooms"]').first
    hotel_rooms.fill("2"); hotel_rooms.blur()
    hotel_nights = builder.locator('.contract-entry-number[data-field="nights"]').first
    hotel_nights.fill("2"); hotel_nights.blur()
    hotel_sentence = builder.locator('textarea[data-contract-field^="clause."][data-contract-field$=".bodyText"]').last.input_value()
    assert hotel_sentence == "Client will provide two (2) premium hotel rooms for two (2) nights.", hotel_sentence

    builder.locator('[data-action="toggle-add-clause-picker"]').click()
    builder.locator('[data-action="add-contract-clause"]', has_text="Hotel").click()
    builder.locator('[data-action="add-clause-entry"]').last.click()
    hotel_tier_selects = builder.locator('.contract-entry-select[data-field="tier"]')
    hotel_tier_selects.last.select_option("standard")
    hotel_rooms_last = builder.locator('.contract-entry-number[data-field="rooms"]').last
    hotel_rooms_last.fill("1"); hotel_rooms_last.blur()
    hotel_nights_last = builder.locator('.contract-entry-number[data-field="nights"]').last
    hotel_nights_last.fill("3"); hotel_nights_last.blur()
    hotel_sentence_2 = builder.locator('textarea[data-contract-field^="clause."][data-contract-field$=".bodyText"]').last.input_value()
    assert hotel_sentence_2 == "Client will provide one (1) standard hotel room for three (3) nights.", hotel_sentence_2

    assert not errors, f"console errors during multi-artist flight/hotel clause flow: {errors}"


def test_discount_and_down_payment_recompute_live(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "Payment Math Client", "2027-10-05")
    builder = open_contract_builder_from_lead(page)

    total_input = builder.locator('input[data-contract-field="payment.total"]')
    total_input.fill("10000"); total_input.blur()

    discount_input = builder.locator('input[data-contract-field="payment.discountValue"]')
    discount_input.fill("10"); discount_input.blur()  # 10% off by default discount type

    down_input = builder.locator('input[data-contract-field="payment.downPaymentPct"]')
    down_input.fill("20"); down_input.blur()

    ledger_text = builder.locator('.ledger').first.inner_text()
    # 10000 total, 10% discount = -1000 (shown), then 20% down payment of the 9000 remaining
    # (not itself shown as a line) = 1800 down, balance = 9000 - 1800 = 7200.
    assert "$10,000" in ledger_text, ledger_text
    assert "-$1,000" in ledger_text, ledger_text
    assert "$1,800" in ledger_text, ledger_text
    assert "$7,200" in ledger_text, ledger_text

    assert not errors, f"console errors during live payment math: {errors}"


def test_brand_switch_updates_doc_preview(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "Brand Switch Client", "2027-11-01")
    builder = open_contract_builder_from_lead(page)

    builder.locator('[data-action="view-contract-builder-doc"]').click()
    doc = page.locator('#contractBuilderPrintHost .doc')
    doc.wait_for(state='visible')
    assert "ASP" in doc.locator('.doc-letterhead').inner_text()
    page.locator('[data-action="close-contract-builder-doc"]').click()

    builder.locator('[data-action="pick-contract-brand"]', has_text="SING Entertainment").click()
    builder.locator('[data-action="view-contract-builder-doc"]').click()
    doc = page.locator('#contractBuilderPrintHost .doc')
    doc.wait_for(state='visible')
    assert "SING Entertainment" in doc.locator('.doc-letterhead').inner_text()

    assert not errors, f"console errors during brand switch: {errors}"


def test_contract_persists_after_reload(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "Reload Persistence Client", "2027-12-15")
    builder = open_contract_builder_from_lead(page)
    builder.locator('input[data-contract-field="snapshot.venue"]').fill("Persisted Venue Hall")
    builder.locator('[data-action="set-contract-status"][data-status="sent"]').click()
    builder.get_by_role("button", name="Done").click()

    page.reload()
    login_as(page, "admin_bookings")
    goto_nav(page, "leads")
    page.locator('tr[data-action="open-event"]', has_text="Reload Persistence Client").click()
    contract_row = page.locator('[data-action="open-contract-builder"]').first
    assert "Sent" in contract_row.inner_text(), "contract status did not persist after reload"
    contract_row.click()
    reopened = page.locator('#contractBuilderOverlayHost .sheet')
    reopened.wait_for(state='visible')
    assert reopened.locator('input[data-contract-field="snapshot.venue"]').input_value() == "Persisted Venue Hall"

    assert not errors, f"console errors during reload persistence check: {errors}"
