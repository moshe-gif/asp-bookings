"""
Clients sign contracts online (migration 0052, Edge Function contract-sign, frontend/sign/).
Real end to end against production Supabase: an admin approves a contract and makes a signing link;
a separate browser with no ASP login opens it, is refused without the consent box, signs; the
admin's Contract Builder then shows "Signed online by …" (pushed live) and the contract is Signed.

Harness links are keyed "CT-TEST-…" (never a real contract) and send no email. Admins can't delete
signing links; remove the rows after a run (ops/CONTRACT_SIGN_SETUP.md → Testing).
"""
from helpers import login_as, collect_console_errors, create_lead, pick_template


def test_client_signs_contract_online(live_server, page, browser):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "Online Signing Client", "2027-11-04", artist_id="eli")
    page.locator('[data-action="create-contract"]').click()
    pick_template(page, "standard")
    builder = page.locator('#contractBuilderOverlayHost .sheet')
    builder.wait_for(state='visible')

    # No link before the money/terms are approved.
    builder.locator('[data-action="make-sign-link"]').click()
    assert builder.locator('[data-testid="sign-link-url"]').count() == 0

    builder.locator('[data-action="approve-contract-for-sending"]').first.click()
    builder.locator('[data-action="make-sign-link"]').click()
    link_box = builder.locator('[data-testid="sign-link-url"]')
    link_box.wait_for(state='visible', timeout=15000)
    url = link_box.input_value()
    assert '/sign/#' in url
    # Making a link for a draft means it is going out: the contract is now Sent.
    assert builder.locator('[data-action="set-contract-status"][data-status="sent"].sel').count() == 1

    # The client: a fresh browser, never signed in to ASP.
    client_ctx = browser.new_context()
    client = client_ctx.new_page()
    client_errors = collect_console_errors(client)
    client.goto(url)
    client.locator('iframe[title="Contract"]').wait_for(state='visible', timeout=20000)
    frame = client.frame_locator('iframe[title="Contract"]')
    doc_text = frame.locator('body').inner_text()
    assert 'Online Signing Client' in doc_text
    assert 'Draft' not in doc_text  # the client's copy reads as sent, never "Draft"

    client.locator('#name').fill('Test Signer')
    client.locator('#signbtn').click()
    assert 'Tick the box' in client.locator('#err').inner_text()

    client.locator('#agree').check()
    client.locator('#signbtn').click()
    banner = client.locator('[data-testid="signed-banner"]')
    banner.wait_for(state='visible', timeout=20000)
    assert 'Signed by Test Signer' in banner.inner_text()
    assert client.locator('#signform').count() == 0
    # The signed copy carries the signature record.
    assert 'electronic signature record' in frame.locator('body').inner_text().lower()

    # Reopening the link shows it signed, never a second form.
    client.reload()
    client.locator('[data-testid="signed-banner"]').wait_for(state='visible', timeout=20000)
    assert client.locator('#signform').count() == 0
    assert not client_errors, f"console errors on the signing page: {client_errors}"
    client_ctx.close()

    # Back in the office: the signature arrives live and the contract is Signed.
    builder.get_by_text('Signed online by Test Signer').wait_for(state='visible', timeout=20000)
    assert builder.locator('[data-action="set-contract-status"][data-status="signed"].sel').count() == 1
    # No second link for a signed contract.
    assert builder.locator('[data-action="make-sign-link"]').count() == 0

    # Changing the money after the client signed is flagged on the signature.
    fee = builder.locator('input[data-contract-field="fee.amount"]')
    fee.fill("9100"); fee.blur()
    builder.get_by_text('(terms changed since)').wait_for(state='visible', timeout=15000)

    # The new terms can go out and be signed in turn (re-approve, back to Sent, new link).
    builder.locator('[data-action="approve-contract-for-sending"]').first.click()
    builder.locator('[data-action="set-contract-status"][data-status="sent"]').click()
    builder.locator('[data-action="make-sign-link"]').click()
    page.wait_for_function("u => document.querySelector('[data-testid=\"sign-link-url\"]') && document.querySelector('[data-testid=\"sign-link-url\"]').value !== u", arg=url, timeout=15000)
    url2 = builder.locator('[data-testid="sign-link-url"]').input_value()
    client_ctx = browser.new_context()
    client = client_ctx.new_page()
    client.goto(url2)
    client.locator('#name').wait_for(state='visible', timeout=20000)
    client.locator('#name').fill('Second Signer')
    client.locator('#agree').check()
    client.locator('#signbtn').click()
    client.get_by_text('Signed by Second Signer').wait_for(state='visible', timeout=20000)
    client_ctx.close()
    builder.get_by_text('Signed online by Second Signer').wait_for(state='visible', timeout=20000)
    assert builder.get_by_text('(terms changed since)').count() == 0
    assert builder.locator('[data-action="set-contract-status"][data-status="signed"].sel').count() == 1
    assert not errors, f"console errors in the app: {errors}"


def test_voided_contract_link_stops_working(live_server, page, browser):
    page.goto(live_server)
    login_as(page, "admin_bookings")
    create_lead(page, "Void Link Client", "2027-12-02", artist_id="eli")
    page.locator('[data-action="create-contract"]').click()
    pick_template(page, "standard")
    builder = page.locator('#contractBuilderOverlayHost .sheet')
    builder.wait_for(state='visible')
    builder.locator('[data-action="approve-contract-for-sending"]').first.click()
    builder.locator('[data-action="make-sign-link"]').click()
    link_box = builder.locator('[data-testid="sign-link-url"]')
    link_box.wait_for(state='visible', timeout=15000)
    url = link_box.input_value()

    builder.locator('[data-action="set-contract-status"][data-status="void"]').click()
    page.wait_for_timeout(1500)  # the cancel request is fire-and-forget

    client_ctx = browser.new_context()
    client = client_ctx.new_page()
    client.goto(url)
    client.get_by_text('This link is no longer active').wait_for(state='visible', timeout=15000)
    assert client.locator('#signform').count() == 0
    client_ctx.close()


def test_bad_signing_link_explains_itself(live_server, page):
    page.goto(live_server + '/sign/#' + 'A' * 43)
    page.get_by_text('This link doesn’t work').wait_for(state='visible', timeout=15000)
    page.goto(live_server + '/sign/')
    page.reload()
    page.get_by_text('This link doesn’t work').wait_for(state='visible', timeout=15000)
