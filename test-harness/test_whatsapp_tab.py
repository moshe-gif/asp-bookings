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
    # Name a contact (0073), then remove the name again; a media message offers to open its file.
    page.evaluate("""() => { S.wa.messages.unshift({ id:'t2', contact:'15550100177', direction:'in', body:'[audio]', kind:'audio', media_id:'harness-no-such-media', status:'received', created_at:new Date().toISOString() }); }""")
    page.locator('[data-action="wa-new"]').click()
    page.locator('[data-testid="wa-conv"][data-id="15550100177"]').click()
    page.locator('[data-action="wa-edit-name"]').click()
    page.locator("[data-wa-name]").fill("Harness Named Contact")
    page.locator('[data-action="wa-save-name"]').click()
    page.locator(".wa-thread-head", has_text="Harness Named Contact").wait_for(state="visible", timeout=10000)
    page.locator('[data-action="wa-media"]').click()
    page.locator(".wa-err").wait_for(state="visible", timeout=15000)  # unknown media id: refused, nothing fetched
    page.locator('[data-action="wa-edit-name"]').click()
    page.locator("[data-wa-name]").fill("")
    page.locator('[data-action="wa-save-name"]').click()
    page.wait_for_function("() => !S.waEditName && !S.wa.contacts.has('15550100177')", timeout=10000)
    left = page.evaluate("async () => (await supabaseClient.from('whatsapp_contacts').select('contact').eq('contact', '15550100177')).data.length")
    assert left == 0
    page.locator('[data-action="wa-new"]').click()
    page.locator("[data-wa-to]").wait_for(state="visible")
    assert page.locator("[data-wa-draft]").count() == 1
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(400)
    assert not horizontal_overflow(page), horizontal_overflow(page)[:3]
    # The made-up media id is refused with a 404 on purpose; anything else is a real error.
    errors = [e for e in errors if "status of 404" not in e]
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
