"""
The office WhatsApp tab (migration 0071; owner 2026-10-29: "a whatsapp tab on the app only visible to my
account"). Read-only against production -- nothing is sent:

- an admin with WhatsApp access (the harness account, standing in for the owner) has the tab: status shows
  connected + test mode, the chat list and a composer for a new chat; no sideways scrolling on a phone;
- an admin without it (bookkeeping) has no tab, the URL bounces, and the database returns no messages;
- the incoming-message webhook refuses a call without its secret.
"""
import urllib.error
import urllib.request

from helpers import login_as, goto_nav, collect_console_errors, fake_gig, seed_events
from overflow_probe import horizontal_overflow

SUPABASE = "https://psgpxbkncuavlnpplykf.supabase.co"


def test_owner_has_whatsapp_tab(live_server, page):
    seed_events(page, [fake_gig("EV-9301", "benny", "2099-05-06", status="booked", type="Wedding",
                                clientName="Testy Client", clientPhone="(555) 010-0199")])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    errors = collect_console_errors(page)
    goto_nav(page, "whatsapp")
    page.locator(".wa-status").wait_for(state="visible", timeout=20000)
    status = page.locator(".wa-status").inner_text()
    assert "Connected" in status and "Test mode" in status, status
    # A chat with a client's number is named from their gig (client · event date); shown only, nothing stored.
    page.evaluate("""() => { S.wa.messages.unshift({ id:'t1', contact:'15550100199', direction:'in', body:'hello', status:'received', created_at:new Date().toISOString() }); }""")
    page.locator('[data-action="wa-new"]').click()
    assert page.locator('[data-testid="wa-conv"]', has_text="Testy Client · Wedding May 6").count() == 1
    page.locator("[data-wa-to]").wait_for(state="visible")
    assert page.locator("[data-wa-draft]").count() == 1
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(400)
    assert not horizontal_overflow(page), horizontal_overflow(page)[:3]
    assert not errors, errors


def test_others_have_no_whatsapp(live_server, page):
    page.goto(live_server)
    login_as(page, "admin_bookkeeping")
    page.wait_for_function("() => window.S && S.user")
    assert page.locator('.rail-link[data-view="whatsapp"]').count() == 0
    rows = page.evaluate("async () => { const r = await supabaseClient.from('whatsapp_messages').select('id').limit(5); return r.error ? 'error' : r.data.length; }")
    assert rows in (0, "error")
    page.goto(live_server + "/#/whatsapp")
    page.wait_for_timeout(1500)
    assert page.evaluate("S.view") != "whatsapp"


def test_webhook_needs_its_secret():
    req = urllib.request.Request(SUPABASE + "/functions/v1/whatsapp-webhook", data=b"{}", method="POST",
                                 headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req)
        assert False, "webhook accepted a call without the secret"
    except urllib.error.HTTPError as e:
        assert e.code == 403
