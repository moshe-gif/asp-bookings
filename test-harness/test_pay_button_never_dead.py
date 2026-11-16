"""
Owner 2026-11-16: on a client's pay link "it did not let me hit" the Continue button. It works in every
browser we can test, so (1) Continue is never a dead grey button: pressed while Stripe's card box is still
loading, it says so; and (2) the page sends client-pay a report of what it saw (0098), so the office can see
why on the device where it failed. Everything here is answered locally: Stripe.js never arrives, and the
client-pay calls are faked (nothing reaches Supabase or Stripe).
"""
import json

TOKEN = "A" * 43
VIEW = {"ok": True, "payment": {"kind": "event_balance", "status": "open", "blocked": None, "available": True,
        "testMode": True, "publishableKey": "pk_test_fake", "description": "Balance (test)", "reference": "EV-TEST-1",
        "amountCents": 100000, "cardFeeBps": 300, "clientName": "Test Client", "brandName": "ASP", "artistName": "",
        "zelle": None, "officePhone": "", "memo": "", "paid": None, "processing": None, "failureMessage": None}}


def test_continue_answers_while_the_card_form_loads(live_server, page):
    calls = []

    def pay(route, request):
        body = json.loads(request.post_data or "{}")
        calls.append(body)
        route.fulfill(status=200, content_type="application/json", body=json.dumps(VIEW if body.get("action") == "view" else {"ok": True}))
    page.route("**/functions/v1/client-pay", pay)
    page.route("https://js.stripe.com/**", lambda r: None)   # never answers: the card box stays "loading"
    page.goto(f"{live_server}/pay/#{TOKEN}")
    btn = page.locator("#pay-continue")
    btn.wait_for(state="visible", timeout=15000)
    assert btn.is_enabled(), "Continue is grey while the card form loads"
    btn.click()
    page.get_by_text("still loading").wait_for(state="visible", timeout=5000)
    page.wait_for_timeout(500)
    reports = [c for c in calls if c.get("action") == "report"]
    assert reports, f"no report was sent: {calls}"
    assert any("pressed before ready" in s for s in reports[0]["steps"]), reports[0]
    assert all("4242" not in s for r in reports for s in r["steps"])
