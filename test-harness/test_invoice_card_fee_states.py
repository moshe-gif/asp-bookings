"""
Card surcharges are banned in CT and MA (owner confirmed 2026-11-12, audit #10.1). A custom invoice for a
client in one of those states never carries a card fee, even when the office forgets the checkbox; a client
elsewhere keeps the office's setting. Fictional data in the test browser only (shared sync is off, and with
no signed-in Supabase session nothing is emailed).
"""
from helpers import login_as, goto_nav, collect_console_errors


def _make_invoice(page, client, state):
    page.locator('[data-action="open-new-invoice"]').click()
    form = page.locator('[data-field="clientName"]').last
    form.fill(client)
    page.locator('[data-testid="invoice-client-state"]').fill(state)
    page.locator('input[data-field="itemLabel"]').fill("Sound reimbursement")
    page.locator('input[data-field="itemAmount"]').fill("300")
    page.locator('[data-action="add-invoice-item"]').click()
    page.locator('[data-action="submit-invoice"]').click()
    find = "c => JSON.parse(localStorage.getItem('asp_mock_invoices_v1') || '[]').find(i => i.clientName === c)"
    page.wait_for_function(f"c => !!({find})(c)", arg=client)
    return page.evaluate(f"c => {{ const i = ({find})(c); return {{ state: i.clientState, noFee: !!i.noCardFee }}; }}", client)


def test_invoice_in_ct_or_ma_never_gets_a_card_fee(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.wait_for_function("() => (window.S && S.user) ? true : false")
    goto_nav(page, "financials")
    page.wait_for_selector('[data-action="open-new-invoice"]')

    assert _make_invoice(page, "Fee Test Mass Client", "Mass.") == {"state": "MA", "noFee": True}
    assert _make_invoice(page, "Fee Test Conn Client", "connecticut") == {"state": "CT", "noFee": True}
    assert _make_invoice(page, "Fee Test NY Client", "ny") == {"state": "NY", "noFee": False}
    assert not errors, f"console errors: {errors}"
