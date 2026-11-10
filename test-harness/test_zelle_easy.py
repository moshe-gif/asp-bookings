"""
Zelle made easy on the client's pay page (owner 2026-11-10): who to send to, the amount and the memo each
have a Copy button, and "I've sent it with Zelle" tells the office (client-pay action zelle_sent) without
marking anything paid. The client-pay function is mocked; nothing leaves the browser.
"""
import json

TOKEN = "Z" * 43


def test_zelle_box_copy_and_sent(live_server, page):
    calls = []
    view = {"ok": True, "payment": {
        "kind": "event_balance", "status": "open", "blocked": None, "available": False, "testMode": True,
        "publishableKey": None, "description": "Balance (Test Gig)", "reference": "EV-TEST-Z", "amountCents": 850000,
        "cardFeeBps": 300, "clientName": "Zelle Test Client", "brandName": "ASP", "artistName": "Test Singer",
        "replyTo": None, "zelle": {"qrUrl": None, "handle": "billing@example.com"}, "officePhone": None,
        "memo": "Zelle Test Client Test Gig", "zelleSentAt": None, "paid": None}}

    def handle(route):
        body = json.loads(route.request.post_data or "{}")
        calls.append(body.get("action"))
        if body.get("action") == "zelle_sent":
            route.fulfill(status=200, content_type="application/json", body=json.dumps({"ok": True, "at": "2026-11-10T12:00:00Z"}))
        else:
            route.fulfill(status=200, content_type="application/json", body=json.dumps(view))
    page.route("**/functions/v1/client-pay", handle)
    page.context.grant_permissions(["clipboard-read", "clipboard-write"])
    page.goto(f"{live_server}/pay/#{TOKEN}")

    box = page.locator('[data-testid="pay-zelle"]')
    box.wait_for(state="visible")
    text = box.inner_text()
    assert "billing@example.com" in text and "$8,500.00" in text and "Zelle Test Client Test Gig" in text, text
    assert "no fee" in text.lower()

    box.locator('[data-zcopy="handle"]').click()
    assert page.evaluate("navigator.clipboard.readText()") == "billing@example.com"
    box.locator('[data-zcopy="amount"]').click()
    assert page.evaluate("navigator.clipboard.readText()") == "8500.00"

    box.locator('[data-testid="zelle-sent"]').click()
    page.locator('[data-testid="zelle-sent-done"]').wait_for(state="visible")
    assert "zelle_sent" in calls
