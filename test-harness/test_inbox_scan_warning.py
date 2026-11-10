"""
Inbox warning (v1.9.71; 2026-11-10: the AI account that reads the emails ran out of credit and nothing said so for
two days). When the scan's state row has an error, the Inbox shows "Email reading has stopped" with what to do.
The state row is answered by a stub here (the real one changes with the real scanner).
"""
import json
from helpers import login_as, goto_nav


def _stub_state(page, err):
    body = json.dumps({"last_run_at": "2026-11-10T21:40:00Z", "last_error": err})
    page.route("**/rest/v1/inbox_scan_state*", lambda route: route.fulfill(status=200, content_type="application/json", body=body))


def test_inbox_says_when_email_reading_stopped(live_server, page):
    _stub_state(page, "office@: 20 of 20 emails couldn't be read: 400 Your credit balance is too low to access the Anthropic API.")
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "messages")
    w = page.locator('[data-testid="inbox-scan-error"]')
    w.wait_for(state="visible", timeout=15000)
    assert "out of credit" in w.inner_text() and "Plans" in w.inner_text()


def test_inbox_has_no_warning_when_reading_works(live_server, page):
    _stub_state(page, None)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "messages")
    page.locator('[data-action="inbox-check-now"]').wait_for(state="visible")
    page.wait_for_timeout(1500)
    assert page.locator('[data-testid="inbox-scan-error"]').count() == 0
