"""
Owner 2026-11-17: the client is told the fees before paying -- bank transfer no fee, debit no fee, credit card the
card fee (with the dollar amount). With no card fee (CT/MA, or the fee set to 0) the page just says there are no
fees. Everything is answered locally (client-pay faked, Stripe.js never loads).
"""
import json

TOKEN = "B" * 43


def _view(fee_bps):
    return {"ok": True, "payment": {"kind": "event_balance", "status": "open", "blocked": None, "available": True,
            "testMode": False, "publishableKey": "pk_test_fake", "description": "Balance (test)", "reference": "EV-TEST-1",
            "amountCents": 250000, "cardFeeBps": fee_bps, "clientName": "Test Client", "brandName": "ASP", "artistName": "",
            "zelle": None, "officePhone": "", "memo": "", "paid": None, "processing": None, "failureMessage": None}}


def _open(page, live_server, fee_bps):
    page.route("**/functions/v1/client-pay", lambda r: r.fulfill(status=200, content_type="application/json", body=json.dumps(_view(fee_bps))))
    page.route("https://js.stripe.com/**", lambda r: None)
    page.goto(f"{live_server}/pay/#{TOKEN}")
    page.locator("#pay-continue").wait_for(state="visible", timeout=15000)


def test_fees_are_listed_before_paying(live_server, page):
    _open(page, live_server, 300)
    fees = page.locator('[data-testid="pay-fees"]')
    text = fees.inner_text()
    assert "Bank transfer" in text and "Debit card" in text and "Credit card" in text
    assert text.count("No fee") == 2
    assert "3% fee ($75.00)" in text, text


def test_no_fee_list_without_a_card_fee(live_server, page):
    _open(page, live_server, 0)
    assert page.locator('[data-testid="pay-fees"]').count() == 0
    page.get_by_text("No fees.").first.wait_for(state="visible", timeout=5000)
