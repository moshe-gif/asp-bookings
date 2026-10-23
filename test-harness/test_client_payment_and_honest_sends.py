"""
2026-10-09 audit fixes W1-3:
- 2.4/3.11: client balance emails name the payee profile's Zelle (or tell the client to contact the
  office) -- never the artist's app login email -- and the in-app preview is built by the same
  function as the email that is actually sent.
- 2.5: the event sheet's primary contract button used to send nothing while logging "emailed" and
  marking the lead contract_sent. It now routes to the real Contract Builder send path.
"""
from helpers import login_as, goto_nav, collect_console_errors, fake_gig, seed_events

GIGS = [
    fake_gig("EV-9101", "benny", "2027-05-02", clientEmail="client@example.com", status="booked"),
    fake_gig("EV-9102", "benny", "2027-06-06", clientEmail="lead@example.com", status="lead", depositReceived=False),
]


def _open_gig(page, view, client_name):
    goto_nav(page, view)
    page.locator('[data-action="open-event"]', has_text=client_name).first.click()
    page.locator(".sheet").first.wait_for(state="visible")


def test_reminder_preview_never_uses_artist_login_email(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, GIGS)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _open_gig(page, "financials", "Test Client EV-9101")
    page.locator('[data-action="preview-reminder"]').first.click()
    preview = page.locator('.doc', has_text="Reminder Email Preview").first
    preview.wait_for(state="visible")
    text = preview.inner_text()
    assert "@aspmanagement.com" not in text, f"preview tells the client to Zelle an app login email: {text}"
    assert ("directly to" in text) or ("send to" in text) or ("scan the code" in text) or ("contact the office" in text), text
    assert not errors, f"console errors: {errors}"


def test_primary_contract_button_routes_to_real_builder_and_logs_nothing(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, GIGS)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _open_gig(page, "leads", "Test Client EV-9102")
    page.locator('[data-action="create-contract"]').first.click()
    # A one-artist wedding opens the Standard Artist Agreement straight away; anything else, the picker.
    page.wait_for_function("() => document.querySelector('#templatePickerOverlayHost')"
                           " || document.querySelector('#contractBuilderOverlayHost .sheet')", timeout=15000)
    ev = page.evaluate("() => window.S.events.find(e => e.id === 'EV-9102')")
    assert ev["status"] == "lead", f"lead status changed without a real send: {ev['status']}"
    assert not any("emailed" in (l.get("text") or "") for l in ev.get("log", [])), ev.get("log")
    assert not errors, f"console errors: {errors}"


def test_post_event_thanks_is_a_reviewed_draft_sent_once(page, live_server):
    """Post-event thank-you (owner 2026-10-23): a past booked gig offers "Send thank-you"; the modal shows
    the exact recipient and the server-rendered email, an edit refreshes the preview before anything can
    send, Send makes ONE send-thanks call with the edited wording, and the gig then shows it as sent.
    send-thanks and client_followups are stubbed -- no email is sent and nothing is logged for real."""
    import json as _json, datetime as _dt
    PAST = (_dt.date.today() - _dt.timedelta(days=5)).isoformat()
    errors = collect_console_errors(page)
    calls = []
    cors = {"Access-Control-Allow-Origin": "*"}
    def thanks(route):
        if route.request.method == "OPTIONS":
            return route.fulfill(status=200, headers={**cors, "Access-Control-Allow-Headers": "*"}, body="ok")
        body = _json.loads(route.request.post_data or "{}")
        calls.append(body)
        reply = {"ok": True, "preview": True, "html": f"<p>{body.get('text', '')}</p>"} if body.get("preview") else {"ok": True, "testMode": False}
        route.fulfill(status=200, content_type="application/json", headers=cors, body=_json.dumps(reply))
    page.route("**/functions/v1/send-thanks", thanks)
    page.route("**/rest/v1/client_followups*", lambda route: route.fulfill(status=200, content_type="application/json", headers=cors, body="[]"))
    seed_events(page, [fake_gig("EV-9111", "benny", PAST, clientName="Thanks Test Client", clientEmail="thanks@example.com", status="paid", balanceReceived=True),
                       fake_gig("EV-9112", "benny", "2027-09-07", clientName="Future Test Client", clientEmail="future@example.com", status="booked")])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    # Dashboard lists the recent past gig (not the upcoming one); the gig itself offers the same action.
    page.locator('[data-action="open-thanks"][data-id="EV-9111"]').first.wait_for(timeout=15000)
    assert page.locator('[data-action="open-thanks"][data-id="EV-9112"]').count() == 0, "an upcoming gig must not offer a thank-you"
    page.locator('span[data-action="open-event"][data-id="EV-9111"]').click()
    page.locator(".sheet").first.wait_for(state="visible")
    page.locator('.sheet [data-action="open-thanks"][data-id="EV-9111"]').click()
    page.locator('iframe[title="Email preview"]').wait_for(state="attached")
    assert page.locator('input[data-form="thanks"], [data-form="thanks"] input[data-field="to"]').first.input_value() == "thanks@example.com"
    assert "Dear Thanks," in page.locator('[data-form="thanks"] textarea[data-field="text"]').input_value()
    assert all(c.get("preview") for c in calls), "opening the draft must not send"
    # Edit, then Send: the first Send only refreshes the preview to the edited wording.
    page.locator('[data-form="thanks"] textarea[data-field="text"]').fill("Dear Thanks,\n\nEdited wording for the test.")
    page.locator('[data-action="send-thanks"][data-id="EV-9111"]').click()
    page.wait_for_function("() => (document.querySelector('iframe[title=\"Email preview\"]')?.getAttribute('srcdoc')||'').includes('Edited wording')", timeout=10000)
    assert not [c for c in calls if not c.get("preview")], "an unpreviewed edit must not be sent"
    page.locator('[data-action="send-thanks"][data-id="EV-9111"]').click()
    page.locator('.sheet').get_by_text('Thank-you email sent', exact=True).wait_for(timeout=10000)
    sends = [c for c in calls if not c.get("preview")]
    assert len(sends) == 1 and sends[0]["gig"] == "EV-9111" and sends[0]["to"] == "thanks@example.com" and "Edited wording" in sends[0]["text"], sends
    assert page.locator('.sheet [data-action="open-thanks"]').count() == 0, "a thanked gig must not offer it again"
    # The preview iframe is sandboxed (no scripts, no storage), so the harness's own init scripts fail in it.
    errors = [e for e in errors if "sandboxed" not in e]
    assert not errors, f"console errors: {errors}"
