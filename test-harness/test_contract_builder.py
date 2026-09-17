"""
Contract Builder v2: real-template contracts (Standard / Comedian / Multi-Performer) reached from
a lead's detail sheet, replacing the earlier generic clause-library version. Separate from the
existing simple per-event auto-doc "Contracts" page, which this feature does not touch. Covers a
template picked at creation (locked after), per-artist payee-profile autofill (entity + default
boilerplate + overtime interval), a Standard contract with Baruch-Levine-style boilerplate, a
Comedian contract with the No-Recording/credit-future cancellation defaults, a Multiline contract
with line items + add-ons matching the real Stein package numbers and its tiered cancellation
schedule, live fee/deposit math, and reload persistence.
"""
from helpers import login_as, goto_nav, collect_console_errors


def create_lead(page, client_name, date, artist_id="benny"):
    page.locator('[data-action="open-new-lead"]').click()
    page.locator(f'[data-action="pick-artist"][data-id="{artist_id}"]').click()
    page.locator('input[data-field="clientName"]').fill(client_name)
    page.locator('input[data-field="date"]').fill(date)
    page.locator('[data-action="submit-lead"]').click()


def create_contract_from_lead(page, template):
    page.locator('[data-action="create-contract"]').click()
    page.locator(f'[data-action="pick-template-create"][data-template="{template}"]').click()
    builder = page.locator('#contractBuilderOverlayHost .sheet')
    builder.wait_for(state='visible')
    return builder


def test_standard_contract_autofills_performer_and_payee_profile(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "Contract Autofill Client", "2027-08-20", artist_id="baruch")
    builder = create_contract_from_lead(page, "standard")

    assert builder.locator('input[data-contract-field="snapshot.clientName"]').input_value() == "Contract Autofill Client"
    assert builder.locator('input[data-contract-field="snapshot.eventDate"]').input_value() == "2027-08-20"
    # Every autofilled field stays editable -- prove it by changing one and re-reading it back.
    name_field = builder.locator('input[data-contract-field="snapshot.clientName"]')
    name_field.fill("Edited Client Name")
    name_field.blur()
    assert name_field.input_value() == "Edited Client Name"

    # The lead's performer (Baruch Levine) should auto-resolve his payee profile + real boilerplate
    # defaults (Mechitza with dancing, no secular songs) without any manual picking.
    assert builder.locator('.contract-performer-select').input_value() == "baruch"
    assert "Baruch Levine Music Inc." in builder.locator('p', has_text='Payee:').first.inner_text()
    assert builder.locator('input[data-contract-field="boilerplate.mechitzaWithDancingOnly"]').is_checked()
    assert builder.locator('input[data-contract-field="boilerplate.noSecularSongs"]').is_checked()

    assert not errors, f"console errors during standard contract autofill: {errors}"


def test_standard_contract_doc_preview_shows_payee_and_cancellation(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "Doc Preview Client", "2027-09-10", artist_id="eli")
    builder = create_contract_from_lead(page, "standard")

    fee_input = builder.locator('input[data-contract-field="fee.amount"]')
    fee_input.fill("7500"); fee_input.blur()

    builder.locator('[data-action="view-contract-builder-doc"]').click()
    doc = page.locator('#contractBuilderPrintHost .doc')
    doc.wait_for(state='visible')
    doc_text = doc.inner_text()
    assert "ARTIST AGREEMENT" in doc_text
    assert "Eli Marcus" in doc_text
    assert "$7,500" in doc_text
    # Default cancellation policy on Standard is flat 80%, matching every real ASP-format contract.
    assert "80% of the payment" in doc_text
    # Eli Marcus's real payment info (Zelle) should appear via his resolved payee profile.
    assert "elimarcusmusic@gmail.com" in doc_text

    assert not errors, f"console errors during standard doc preview: {errors}"


def test_comedian_contract_defaults_no_recording_and_credit_cancellation(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "Comedy Night Client", "2027-10-05", artist_id="dovie")
    builder = create_contract_from_lead(page, "comedian")

    # Comedian contracts default to credit-toward-future-event cancellation (not flat-percent-owed)
    # and the No Recording Clause toggle on, matching every real Dovi Neuburger comedian contract.
    assert "sel" in (builder.locator('[data-action="pick-cancellation-type"][data-value="credit_future"]').get_attribute("class") or "")
    assert builder.locator('input[data-contract-field="boilerplate.noRecording"]').is_checked()
    assert builder.locator('input[data-contract-field="boilerplate.acceptanceClause"]').is_checked()

    builder.locator('[data-action="view-contract-builder-doc"]').click()
    doc = page.locator('#contractBuilderPrintHost .doc')
    doc.wait_for(state='visible')
    doc_text = doc.inner_text()
    assert "COMEDIAN AGREEMENT" in doc_text
    assert "No Recording Clause" in doc_text
    assert "credited toward a future event" in doc_text

    assert not errors, f"console errors during comedian contract defaults: {errors}"


def test_multiline_line_items_addons_and_tiered_cancellation(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "Stein Package Client", "2026-11-29", artist_id="eli")
    builder = create_contract_from_lead(page, "multiline")

    # Multiline defaults to a tiered cancellation schedule (not flat %), matching the real Stein
    # package contract's three-tier policy.
    assert "sel" in (builder.locator('[data-action="pick-cancellation-type"][data-value="tiered"]').get_attribute("class") or "")
    within_inputs = builder.locator('input[data-contract-field^="tier."][data-contract-field$=".withinDays"]')
    percent_inputs = builder.locator('input[data-contract-field^="tier."][data-contract-field$=".percent"]')
    assert within_inputs.count() == 3
    assert [within_inputs.nth(i).input_value() for i in range(3)] == ["60", "30", "0"]
    assert [percent_inputs.nth(i).input_value() for i in range(3)] == ["0", "80", "100"]

    # Add the real Stein line items + one add-on and confirm the fee auto-sums.
    builder.locator('[data-action="add-line-item"]').click()
    labels = builder.locator('input[data-contract-field^="lineitem."][data-contract-field$=".label"]')
    fees = builder.locator('input[data-contract-field^="lineitem."][data-contract-field$=".fee"]')
    labels.nth(0).fill("Eli Marcus - 5hr from performance start")
    fees.nth(0).fill("6500"); fees.nth(0).blur()

    builder.locator('[data-action="add-line-item"]').click()
    labels.nth(1).fill("DJ Tzvi Singer - Third Dance set")
    fees.nth(1).fill("3000"); fees.nth(1).blur()

    builder.locator('[data-action="add-line-item"]').click()
    labels.nth(2).fill("Gershon Freishtat Band - 12 piece orchestra")
    fees.nth(2).fill("16750"); fees.nth(2).blur()

    builder.locator('[data-action="add-add-on"]').click()
    addon_labels = builder.locator('input[data-contract-field^="addon."][data-contract-field$=".label"]')
    addon_amounts = builder.locator('input[data-contract-field^="addon."][data-contract-field$=".amount"]')
    addon_labels.nth(0).fill("Custom Band Stands")
    addon_amounts.nth(0).fill("1600"); addon_amounts.nth(0).blur()

    fee_total = builder.locator('input[data-contract-field="fee.amount"]')
    assert fee_total.input_value() == "27850", fee_total.input_value()  # 6500+3000+16750+1600

    deposit_input = builder.locator('input[data-contract-field="deposit.amount"]')
    deposit_input.fill("10000"); deposit_input.blur()
    ledger_text = builder.locator('.ledger').first.inner_text()
    assert "$27,850" in ledger_text, ledger_text
    assert "$10,000" in ledger_text, ledger_text
    assert "$17,850" in ledger_text, ledger_text  # balance

    assert not errors, f"console errors during multiline line items/add-ons: {errors}"


def test_deposit_percent_drives_live_math(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "Deposit Percent Client", "2027-12-01", artist_id="benny")
    builder = create_contract_from_lead(page, "standard")

    fee_input = builder.locator('input[data-contract-field="fee.amount"]')
    fee_input.fill("15000"); fee_input.blur()

    percent_input = builder.locator('input[data-contract-field="deposit.percent"]')
    percent_input.fill("15"); percent_input.blur()  # matches the real Benny Friedman/Yaakov Link contract

    ledger_text = builder.locator('.ledger').first.inner_text()
    assert "$15,000" in ledger_text, ledger_text
    assert "$2,250" in ledger_text, ledger_text  # 15% deposit
    assert "$12,750" in ledger_text, ledger_text  # balance

    assert not errors, f"console errors during deposit percent live math: {errors}"


def test_send_contract_confirm_flow_fails_gracefully_without_backend(live_server, page):
    # The send-contract-email Supabase Edge Function isn't deployed yet in this test environment
    # (it requires manual one-time setup of a mail relay -- see ops/SEND_CONTRACT_SETUP.md), so
    # this only proves the button opens a prefilled confirm modal and that attempting to send
    # fails as a handled, user-visible toast rather than an uncaught JS error.
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "Send Contract Client", "2027-08-01", artist_id="eli")
    builder = create_contract_from_lead(page, "standard")

    builder.locator('[data-action="view-contract-builder-doc"]').click()
    doc = page.locator('#contractBuilderPrintHost .doc')
    doc.wait_for(state='visible')

    page.locator('[data-action="open-send-contract"]').click()
    confirm = page.locator('#sendContractOverlayHost .modal')
    confirm.wait_for(state='visible')
    assert "Send Contract" in confirm.inner_text()
    assert "Standard Artist Agreement" in confirm.locator('input[data-field="subject"]').input_value()

    confirm.locator('input[data-field="to"]').fill("client@example.com")
    confirm.locator('[data-action="confirm-send-contract"]').click()

    toast = page.locator('#toasts .toast')
    toast.first.wait_for(state='visible', timeout=15000)

    assert not errors, f"console errors during send-contract confirm flow: {errors}"


def test_contract_persists_after_reload(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "Reload Persistence Client", "2027-12-15", artist_id="benny")
    builder = create_contract_from_lead(page, "standard")
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
