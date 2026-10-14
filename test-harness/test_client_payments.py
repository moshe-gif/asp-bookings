"""
Clients pay online (migration 0056, Edge Functions client-pay / stripe-webhook / stripe-status,
frontend/sign/pay.js, frontend/pay/). Real end to end against production Supabase.

With Stripe TEST keys set: an admin approves a contract with a $500 deposit and a 3% card fee and
makes a signing link; a browser with no ASP login sees the deposit is payable only after signing,
signs, enters Stripe's test credit card, is shown the fee and total BEFORE paying, pays; the admin's
builder shows "Deposit paid online" and the gig is Booked with the deposit received. A debit card is
shown no fee. Without Stripe keys: the link carries no payment and the page shows no Pay panel.
In live mode the payment steps are skipped (the harness never moves real money).

Harness rows use "CT-TEST-…" ids, send no email and write no ledger or gig log. Clean up after a run
(ops/STRIPE_SETUP.md → Testing).
"""
from helpers import login_as, collect_console_errors, create_lead, pick_template, goto_nav


def _stripe_status(page):
    page.wait_for_function("() => window.S && S.stripeStatus !== undefined && S.stripeStatus !== null", timeout=20000)
    return page.evaluate("() => S.stripeStatus")


def _make_deposit_link(page, client_name, date, fee_percent="3"):
    goto_nav(page, "settings")
    fee = page.locator('[data-testid="online-payments-card"] input[data-field="cardFeePercent"]')
    fee.fill(fee_percent); fee.blur()
    create_lead(page, client_name, date, artist_id="eli")
    page.locator('[data-action="create-contract"]').click()
    pick_template(page, "standard")
    builder = page.locator('#contractBuilderOverlayHost .sheet')
    builder.wait_for(state='visible')
    dep = builder.locator('input[data-contract-field="deposit.amount"]')
    dep.fill("500"); dep.blur()
    builder.locator('[data-action="approve-contract-for-sending"]').first.click()
    builder.locator('[data-action="make-sign-link"]').click()
    link_box = builder.locator('[data-testid="sign-link-url"]')
    link_box.wait_for(state='visible', timeout=15000)
    return builder, link_box.input_value()


def _sign(client, name):
    client.locator('#name').wait_for(state='visible', timeout=20000)
    client.locator('#name').fill(name)
    client.locator('#agree').check()
    client.locator('#signbtn').click()
    client.locator('[data-testid="signed-banner"]').wait_for(state='visible', timeout=20000)


def _enter_card(client, number):
    frame = client.frame_locator('#pay-element iframe').first
    frame.locator('input[name="number"]').wait_for(state='visible', timeout=30000)
    frame.locator('input[name="number"]').fill(number)
    frame.locator('input[name="expiry"]').fill("12 / 34")
    frame.locator('input[name="cvc"]').fill("123")
    zip_box = frame.locator('input[name="postalCode"]')
    if zip_box.count():
        zip_box.fill("10001")
    client.locator('#pay-continue').click()
    client.locator('[data-testid="pay-review"]').wait_for(state='visible', timeout=30000)


def test_client_signs_then_pays_deposit(live_server, page, browser):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    st = _stripe_status(page)
    builder, url = _make_deposit_link(page, "Online Payment Client", "2027-11-11")

    client_ctx = browser.new_context()
    client = client_ctx.new_page()
    client_errors = collect_console_errors(client)
    client.goto(url)

    if not st.get('connected'):
        _sign(client, "Pay Tester")
        client.wait_for_timeout(2000)
        assert client.locator('[data-testid="pay-panel"]').count() == 0
        client_ctx.close()
        return

    # Payable only after signing.
    panel = client.locator('[data-testid="pay-panel"]')
    panel.wait_for(state='visible', timeout=20000)
    assert 'Sign the contract above first' in panel.inner_text()
    assert '$500.00' in panel.inner_text()
    _sign(client, "Pay Tester")
    panel.get_by_text('Pay your deposit').wait_for(state='visible', timeout=20000)
    assert 'Credit cards have a 3% card fee' in panel.inner_text()
    if st.get('mode') != 'test':
        client_ctx.close()
        return  # never move real money

    # A debit card: no fee.
    _enter_card(client, "4000056655665556")
    assert client.locator('[data-testid="fee-line"]').count() == 0
    assert client.locator('[data-testid="pay-total"]').inner_text() == '$500.00'

    # A credit card: the fee and total are shown before paying, and that's what is charged.
    client.locator('#pay-change').click()
    _enter_card(client, "4242424242424242")
    assert '$15.00' in client.locator('[data-testid="fee-line"]').inner_text()
    assert client.locator('[data-testid="pay-total"]').inner_text() == '$515.00'
    client.locator('#pay-now').click()
    done = client.locator('[data-testid="paid-banner"]')
    done.wait_for(state='visible', timeout=45000)
    assert '$515.00' in done.inner_text() and '$15.00 credit card fee' in done.inner_text()

    # Reopening the link shows it paid, never a second form.
    client.reload()
    client.locator('[data-testid="paid-banner"]').wait_for(state='visible', timeout=20000)
    assert client.locator('#pay-element').count() == 0
    assert not client_errors, f"console errors on the payment page: {client_errors}"
    client_ctx.close()

    # The office: the payment arrives live; the gig is Booked with the deposit received.
    builder.locator('[data-testid="online-payment"]').wait_for(state='visible', timeout=30000)
    assert 'Deposit paid online' in builder.locator('[data-testid="online-payment"]').inner_text()
    page.wait_for_function("() => S.events.some(e => e.clientName==='Online Payment Client' && e.depositReceived && e.status==='booked')", timeout=15000)
    assert not errors, f"console errors in the app: {errors}"


def test_settings_shows_online_payments(live_server, page):
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _stripe_status(page)
    goto_nav(page, "settings")
    card = page.locator('[data-testid="online-payments-card"]')
    card.wait_for(state='visible', timeout=15000)
    assert 'credit card fee' in card.inner_text().lower()


def test_bad_pay_link_explains_itself(live_server, page):
    page.goto(live_server + '/pay/#' + 'A' * 43)
    page.get_by_text('This link doesn’t work').wait_for(state='visible', timeout=15000)
