"""
ASP branding (owner 2026-10-14): the owner's logo files (frontend/assets/brand/, cut from the logo
sheet) everywhere instead of the old 5-bar "ASP" wordmark; the logo's A, traced as SVG
(aspIconSvg), is the opener and the loading indicator with its bars moving. One client payment
section (paymentOptionsEmailBlock): pay online first, Zelle QR, then a one-line check/cash footnote.
"""
from helpers import login_as, collect_console_errors, create_lead, pick_template, goto_nav


def test_logo_on_login_opener_and_rail(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    # The opener is only the logo's A (owner 2026-10-14), its eight bars animating.
    assert page.locator('#opener .opener-a .asp-bars rect').count() == 8
    assert page.locator('#opener img').count() == 0, "opener should show only the A"
    login_as(page, "admin_bookings")
    rail = page.locator('.rail .wordmark')
    assert rail.locator('img.logo-on-light').count() == 1 and rail.locator('img.logo-on-dark').count() == 1
    assert page.locator('.rail .mark i').count() == 0, "old 5-bar wordmark still in the sidebar"
    # Every logo image actually loads.
    broken = page.evaluate("() => [...document.querySelectorAll('img.brand-logo')].filter(i => i.complete && i.offsetParent && i.naturalWidth === 0).map(i => i.src)")
    assert not broken, f"logo images failed to load: {broken}"
    assert not errors, f"console errors: {errors}"


def test_contract_carries_logo_and_payment_section(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    create_lead(page, "Branding Client", "2027-09-19", artist_id="eli")
    page.locator('[data-action="create-contract"]').click()
    pick_template(page, "standard")
    builder = page.locator('#contractBuilderOverlayHost .sheet')
    builder.wait_for(state='visible')
    dep = builder.locator('input[data-contract-field="deposit.amount"]')
    dep.fill("1500"); dep.blur()
    builder.locator('[data-action="view-contract-builder-doc"]').first.click()
    page.get_by_text('Paying the Deposit').first.wait_for(state='visible', timeout=10000)
    html = page.content()
    assert 'asp-horizontal-light.png' in html or 'asp-horizontal-dark.png' in html, "contract header has no logo"
    text = page.locator('body').inner_text()
    assert 'paying the deposit' in text.lower()
    assert 'To pay by check or cash, please call our office' in text
    assert 'For a deposit by check' not in text and 'Wire:' not in text, "old check/wire payment text still on the contract"
    assert not errors, f"console errors: {errors}"


def test_settings_offers_the_deposit_zelle_qr(live_server, page):
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "settings")
    card = page.locator('[data-testid="online-payments-card"]')
    card.wait_for(state='visible', timeout=15000)
    assert card.locator('input[data-action="upload-deposit-zelle-qr"]').count() == 1
    assert card.locator('input[data-field="depositZelleHandle"]').count() == 1
