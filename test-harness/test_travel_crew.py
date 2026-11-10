"""
Travel login (migration 0090; owner 2026-11-09: "Rivky = travel + gig info only"). Real end to end against
production, like test_crew.py:

- the office test account adds a test travel crew row (test-travel@aspmgmt.com, kind 'travel');
- the travel account signs in and lands on Today, with Today / Calendar / Travel only (no Media, no Ask AI);
- it reads every booked gig through crew_gig_view (travel columns filled, no money column) and the travel
  requests through crew_travel_view, and no office table (events, app_records, payments...);
- no dollar amount anywhere on Today, Travel, or an open gig;
- the office's Delete on a gig is only for the owner / Ilan: admin_bookings (the harness office account)
  doesn't get it.

Reads real gigs (read-only); writes only the test travel crew row, removed at the end.
"""
import re

from helpers import login_as, dismiss_opener, collect_console_errors, fake_gig, seed_events

ROW = ("Test Travel", "test-travel@aspmgmt.com", "travel")
MONEY = re.compile(r"\$\s?\d")


def _row(page, add):
    return page.evaluate("""async ({row, add}) => {
        const del = await supabaseClient.from('crew_members').delete().eq('email', row[1]);
        if(del.error) return del.error.message;
        if(!add) return null;
        const ins = await supabaseClient.from('crew_members').insert({ name: row[0], email: row[1], kind: row[2] });
        return ins.error ? ins.error.message : null;
    }""", {"row": list(ROW), "add": add})


def test_travel_login_sees_travel_and_no_money(live_server, page, browser):
    page.goto(live_server)
    login_as(page, "admin_bookings")
    err = _row(page, add=True)
    assert err is None, err
    try:
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        ctx.add_init_script("window.ASP_DISABLE_EVENT_SYNC = false; window.ASP_DISABLE_SHARED_SYNC = true;")
        t = ctx.new_page()
        errors = collect_console_errors(t)
        t.goto(live_server)
        dismiss_opener(t)
        login_as(t, "crew_travel")
        t.wait_for_function("() => window.S && S.crew && S.artistPortal.on && !!S.artistPortal.loadedAt", timeout=20000)
        assert t.evaluate("S.crew.kind") == "travel"
        nav = t.locator(".artist-top-tabs .tab").all_inner_texts()
        assert nav == ["Today", "Calendar", "Travel"], nav
        assert t.locator('[data-action="open-ask-ai"]').count() == 0

        rows = t.evaluate("async () => (await supabaseClient.from('crew_gig_view').select('*').limit(20)).data")
        assert rows, "travel login sees no gigs"
        for r in rows:
            assert not {"price", "commission", "balance", "deposit_received", "net_amount", "agent_fee"} & set(r), sorted(r)
            assert r["flight_needed"] is not None, "travel columns are empty for the travel login"
        tr = t.evaluate("async () => { const r = await supabaseClient.from('crew_travel_view').select('*'); return r.error ? r.error.message : r.data.length; }")
        assert isinstance(tr, int), tr
        for table in ("events", "app_records", "payment_requests", "payments", "contracts"):
            got = t.evaluate(f"async () => {{ const r = await supabaseClient.from('{table}').select('*').limit(1); return r.error ? 'error' : r.data.length; }}")
            assert got in (0, "error"), f"travel login can read {table}"
        lib = t.evaluate("async () => (await supabaseClient.rpc('can_view_library')).data")
        assert lib is False, "travel login gets the private video library"
        assert not MONEY.search(t.locator(".content").inner_text())

        t.locator(".artist-top-tabs .tab", has_text="Travel").click()
        t.wait_for_function("() => S.view === 'c_travel'")
        assert "Travel requests" in t.locator(".content").inner_text()
        assert not MONEY.search(t.locator(".content").inner_text())

        first = t.locator('[data-testid="crew-gig"] [data-action="open-event"]').first
        if first.count() == 0:
            t.locator(".artist-top-tabs .tab", has_text="Today").click()
            first = t.locator('[data-testid="crew-gig"] [data-action="open-event"]').first
        if first.count():
            first.click()
            t.locator(".sheet").first.wait_for(state="visible")
            assert not MONEY.search(t.locator(".sheet").first.inner_text())
        assert not errors, f"console errors: {errors}"
        ctx.close()
    finally:
        _row(page, add=False)


def _open_from_search(page, gig_id):
    page.locator("[data-home-search]").first.fill(f"Test Client {gig_id}")
    page.locator(f'[data-action="open-event"][data-id="{gig_id}"]').first.click()
    page.locator('[data-action="toggle-event-menu"]').first.click()


def test_only_owner_and_ceo_can_delete(live_server, page):
    seed_events(page, [fake_gig("EV-9401", "benny", "2099-06-01")])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _open_from_search(page, "EV-9401")
    assert page.locator('[data-action="delete-event"]').count() == 0, "a bookings login can delete a gig"


def test_ceo_can_delete(live_server, page):
    seed_events(page, [fake_gig("EV-9402", "benny", "2099-06-02")])
    page.goto(live_server)
    login_as(page, "admin_ceo")
    _open_from_search(page, "EV-9402")
    assert page.locator('[data-action="delete-event"]').count() == 1, "Ilan's login has no Delete"
