"""
Crew accounts (migration 0069; owner 2026-10-28): Tzvi (social media) sees the calendar and every gig
with no money anywhere and asks Lilker (videographer) to film one; Lilker sees only the gigs he is
asked to film, confirms in the app, and has the Videos tab. Real end to end against production:

- the office test account adds two test crew rows (test-social / test-videographer); the crew test
  accounts sign in and the app links them;
- social: lands on Today, has Today / Calendar / Videos and nothing else, reads no office table, sees
  no dollar amount; opens a real upcoming gig and asks the test videographer (through the `crew`
  function -- the test videographer has no phone, so no WhatsApp goes anywhere);
- videographer: sees only that gig, waiting for his answer, confirms it; Videos shows the library
  only (no upload/tag tabs);
- social sees him as filming.

Reads real gigs (read-only); writes only the two test crew rows and their assignment (gig_crew),
removed at the end (also if a previous run left them).
"""
import re

import pytest

from helpers import login_as, dismiss_opener, collect_console_errors
from overflow_probe import horizontal_overflow

CREW = {"crew_social": ("Test Social", "test-social@aspmgmt.com", "social"),
        "crew_videographer": ("Test Videographer", "test-videographer@aspmgmt.com", "videographer")}
MONEY = re.compile(r"\$\s?\d")


def _crew_rows(page, add):
    """As the office test account: remove the test crew rows (and their assignments), then add them back if asked."""
    return page.evaluate("""async ({rows, add}) => {
        const emails = rows.map(r => r[1]);
        const del = await supabaseClient.from('crew_members').delete().in('email', emails);
        if(del.error) return del.error.message;
        if(!add) return null;
        const ins = await supabaseClient.from('crew_members').insert(rows.map(([name, email, kind]) => ({ name, email, kind })));
        return ins.error ? ins.error.message : null;
    }""", {"rows": list(CREW.values()), "add": add})


def _crew_page(browser, live_server, who):
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    # Like the artist live-data spec: the portal must read the live view (crew never write gigs).
    ctx.add_init_script("window.ASP_DISABLE_EVENT_SYNC = false; window.ASP_DISABLE_SHARED_SYNC = true;")
    page = ctx.new_page()
    calls = []
    page.on("request", lambda r: calls.append((r.method, r.url.split("?")[0])) if ".supabase.co/" in r.url else None)
    page.goto(live_server)
    dismiss_opener(page)
    login_as(page, who)
    page.wait_for_function("() => window.S && S.crew && S.artistPortal.on && !!S.artistPortal.loadedAt", timeout=20000)
    return page, calls


def test_crew_assign_confirm_and_no_money(live_server, page, browser):
    page.goto(live_server)
    login_as(page, "admin_bookings")
    err = _crew_rows(page, add=True)
    assert err is None, err
    try:
        # --- Tzvi's view ---
        social, calls = _crew_page(browser, live_server, "crew_social")
        errors = collect_console_errors(social)
        assert social.evaluate("S.view") == "c_home"
        nav = social.locator(".artist-top-tabs .tab").all_inner_texts()
        assert nav == ["Today", "Calendar", "Videos"], nav
        assert social.locator('[data-action="open-ask-ai"]').count() == 0
        rows = social.evaluate("async () => (await supabaseClient.from('crew_gig_view').select('*').limit(5)).data")
        for r in rows:
            assert not {"price", "commission", "balance", "deposit_received", "net_amount", "agent_fee"} & set(r), sorted(r)
        # Office tables stay shut (the staff name list is readable by every signed-in user, artists too: no money in it).
        for table in ("events", "app_records", "payment_requests", "payments", "artists"):
            got = social.evaluate(f"async () => {{ const r = await supabaseClient.from('{table}').select('*').limit(1); return r.error ? 'error' : r.data.length; }}")
            assert got in (0, "error"), f"crew can read {table}"
        assert not MONEY.search(social.locator(".content").inner_text())

        upcoming = social.evaluate("() => S.events.filter(e => e.date >= new Date().toLocaleDateString('en-CA')).sort((a,b) => a.date.localeCompare(b.date)).map(e => e.id)")
        if not upcoming:
            pytest.skip("no upcoming gig in production to assign")
        gig = upcoming[0]
        vid_id = social.evaluate("() => S.crewRoster.find(c => c.name === 'Test Videographer').id")
        social.locator(f'[data-testid="crew-gig"] [data-action="open-event"][data-id="{gig}"]').first.click()
        card = social.locator('[data-testid="gig-crew"]')
        card.wait_for(state="visible", timeout=10000)
        assert not MONEY.search(social.locator(".sheet").inner_text())
        card.locator(f'[data-action="crew-assign"][data-crew="{vid_id}"]').click()
        social.wait_for_function("([g, v]) => (S.events.find(e => e.id === g).crew || []).some(c => c.crewId === v && c.status === 'requested')", arg=[gig, vid_id], timeout=15000)

        # --- Lilker's view ---
        video, vcalls = _crew_page(browser, live_server, "crew_videographer")
        verrors = collect_console_errors(video)
        ids = video.evaluate("() => S.events.map(e => e.id)")
        assert ids == [gig], f"the videographer sees only his gig: {ids}"
        row = video.locator('[data-testid="crew-gig"]', has=video.locator('[data-action="crew-respond"][data-accept="1"]'))
        row.first.wait_for(state="visible", timeout=10000)
        assert "Waiting for your answer" in video.locator(".content").inner_text()
        row.first.locator('[data-action="crew-respond"][data-accept="1"]').click()
        video.wait_for_function("g => S.events.find(e => e.id === g).myStatus === 'confirmed'", arg=gig, timeout=15000)
        # Videos: the library only, no managing.
        video.locator('.artist-top-tabs .tab', has_text="Videos").click()
        video.locator('[data-testid="lib-browse"]').wait_for(state="visible", timeout=10000)
        assert video.locator('[data-action="lib-tab"]').count() == 0
        assert not MONEY.search(video.locator(".content").inner_text())

        # --- Tzvi sees him filming ---
        social.reload()
        social.wait_for_function("() => window.S && S.crew && !!S.artistPortal.loadedAt", timeout=20000)
        social.wait_for_function("([g, v]) => (S.events.find(e => e.id === g).crew || []).some(c => c.crewId === v && c.status === 'confirmed')", arg=[gig, vid_id], timeout=15000)

        # Phones: no sideways scrolling on any crew screen (owner 2026-10-29).
        for pg in (social, video):
            for width in (320, 390):
                pg.set_viewport_size({"width": width, "height": 844})
                for view in ("c_home", "c_calendar", "videos"):
                    pg.locator(f'.bn-item[data-view="{view}"]').click()
                    pg.wait_for_timeout(500)
                    bad = horizontal_overflow(pg)
                    assert not bad, f"{width}px {view}: {bad[:3]}"
                pg.locator('.bn-item[data-view="c_home"]').click()
                pg.locator(f'[data-testid="crew-gig"] [data-action="open-event"][data-id="{gig}"]').first.click()
                pg.locator(".sheet").wait_for(state="visible", timeout=10000)
                pg.wait_for_timeout(700)  # let the sheet finish sliding in
                bad = horizontal_overflow(pg)
                assert not bad, f"{width}px gig sheet: {bad[:3]}"
                pg.locator('[data-action="close-sheet"]').first.click()

        # Crew only ever wrote through the crew function (never a REST write).
        for method, url in calls + vcalls:
            if "/rest/v1/" in url and method not in ("GET", "HEAD"):
                assert url.rsplit("/", 1)[-1] in ("claim_crew_account", "can_view_library"), f"crew wrote {method} {url}"
        assert not errors and not verrors, f"console errors: {errors + verrors}"
        social.context.close(); video.context.close()
    finally:
        assert _crew_rows(page, add=False) is None
