"""
Artist portal on real data (migration 0038): a signed-in artist's gigs and money come from the
artist_gig_view / artist_finance_view Supabase views, not from this browser's localStorage.

Live, read-only by construction: this spec turns the harness's ASP_DISABLE_EVENT_SYNC off (an
artist's portal load is a read of two views; artists never sync or write), seeds nothing, and
records every request to Supabase -- any write (non-GET REST call, an Edge Function call) or any
request at all to the shared events / app_records tables fails the test.

Real data: the production `events` table may hold no booked gig for a test artist. When the view
is empty for that artist the content checks are skipped and say so -- nothing is faked.
Until 0038 is applied the views don't exist; the spec then skips, naming the migration.
"""
import json
import re

import pytest

from helpers import login_as, goto_nav, collect_console_errors, dismiss_opener, EVENTS_LS_KEY

OWES = re.compile(r"\bowe[sd]?\b|\bowing\b|receivable|balance pending|balance due", re.I)
SHARED_TABLES = ("/rest/v1/events", "/rest/v1/app_records")


def _live_artist_context(browser):
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    # Runs after conftest's autouse flag (init scripts run in order): the portal must read live views.
    ctx.add_init_script("window.ASP_DISABLE_EVENT_SYNC = false; window.ASP_DISABLE_SHARED_SYNC = true;")
    return ctx


def _record_supabase(page):
    calls = []
    page.on("request", lambda r: calls.append({"method": r.method, "url": r.url.split("?")[0]})
            if ".supabase.co/" in r.url else None)
    return calls


def _view_rows(page):
    """The signed-in artist's own view rows, read the same way the app does (their own session)."""
    return page.evaluate("""async () => {
        const [g, f] = await Promise.all([
          window.supabaseClient.from('artist_gig_view').select('*'),
          window.supabaseClient.from('artist_finance_view').select('*'),
        ]);
        const err = g.error || f.error;
        return { error: err ? (err.code || '') + ' ' + (err.message || '') : null, gigs: g.data || [], money: f.data || [] };
    }""")


def _sign_in(page, live_server, who):
    page.goto(live_server)
    dismiss_opener(page)
    login_as(page, who)
    page.wait_for_function("() => { const p = window.S && S.artistPortal;"
                           " return !!(p && p.on && !p.loading && (p.loadedAt || p.error)); }", timeout=20000)


def test_artist_portal_reads_live_views_only(live_server, browser):
    ctx = _live_artist_context(browser)
    page = ctx.new_page()
    errors = collect_console_errors(page)
    calls = _record_supabase(page)
    _sign_in(page, live_server, "benny")

    rows = _view_rows(page)
    if rows["error"] and re.search(r"PGRST205|42P01|does not exist|schema cache", rows["error"]):
        ctx.close()
        pytest.skip(f"migration 0038 not applied yet ({rows['error'].strip()})")
    assert not rows["error"], f"artist views returned an error: {rows['error']}"
    assert page.evaluate("S.artistPortal.error") is None, "portal shows 'couldn't load your gigs'"

    # The app's gigs are exactly the view's rows, nothing from local storage.
    app_ids = sorted(page.evaluate("S.events.map(e => e.id)"))
    view_ids = sorted(g["legacy_id"] or g["event_id"] for g in rows["gigs"])
    assert app_ids == view_ids, f"artist sees gigs that aren't in their view: app={app_ids} view={view_ids}"
    assert page.evaluate("S.events.every(e => e.fromArtistPortal)"), "a non-view gig is in the artist's session"
    me = page.evaluate("""async () => (await window.supabaseClient.from('artists').select('id')
        .eq(/^[0-9a-f-]{36}$/.test(S.user) ? 'id' : 'legacy_id', S.user).maybeSingle()).data.id""")
    assert all(g["artist_id"] == me for g in rows["gigs"] + rows["money"]), "view returned another artist's rows"

    goto_nav(page, "a_gigs", mobile=False)
    page.wait_for_timeout(300)
    body = page.locator("#app").inner_text()
    assert "Couldn't load your gigs" not in body
    assert not OWES.search(body), "owes wording on My Gigs"
    for view in ("a_dashboard", "a_calendar", "a_financials"):
        goto_nav(page, view, mobile=False)
        page.wait_for_timeout(250)
        assert not OWES.search(page.locator("#app").inner_text()), f"owes wording on {view}"
    goto_nav(page, "a_gigs", mobile=False)
    page.wait_for_timeout(250)

    # Nothing written: no REST write, no Edge Function, never the shared tables, cache untouched.
    writes = [c for c in calls if (c["method"] not in ("GET", "HEAD", "OPTIONS") and "/auth/v1/" not in c["url"])
              or "/functions/v1/" in c["url"]]
    assert not writes, f"artist session made write calls: {writes}"
    shared = [c for c in calls if any(t in c["url"] for t in SHARED_TABLES)]
    assert not shared, f"artist session requested the shared tables: {shared}"
    cache = page.evaluate(f"localStorage.getItem({json.dumps(EVENTS_LS_KEY)}) || ''")
    assert not any(i in cache for i in view_ids if i), "artist view rows were written to the gigs cache"

    if not rows["gigs"]:
        assert "Nothing here yet" in body, "empty view but My Gigs doesn't say so"
        assert not errors, f"console errors in the artist portal: {errors}"
        ctx.close()
        pytest.skip("benny has no booked/paid gigs in artist_gig_view -- content checks (client, venue, Waze, %) not exercised")

    # Content: client, venue, Waze link, money with the gig's own percent.
    gig = next(g for g in rows["gigs"] if g["client_name"] or g["venue"])
    row = page.locator(f'tr[data-action="open-event"][data-id="{gig["legacy_id"] or gig["event_id"]}"]').first
    row_text = row.inner_text()
    if gig["client_name"]:
        assert gig["client_name"] in row_text, "client name missing from My Gigs"
    if gig["venue"]:
        assert gig["venue"] in row_text, "venue missing from My Gigs"
        assert row.locator("a", has_text="Navigate (Waze)").count() == 1, "no Waze link on the gig row"
    row.click()
    sheet = page.locator(".sheet").inner_text()
    m = next((x for x in rows["money"] if x["event_id"] == gig["event_id"]), None)
    if m and not m["money_pending"]:
        if m["asp_cut_pct"] is not None:
            pct = f"{float(m['asp_cut_pct']):g}%"
            assert f"ASP fee {pct}" in sheet, f"sheet doesn't show this gig's ASP fee percent ({pct})"
        assert "You receive" in sheet, "sheet has no 'You receive' line"
    else:
        assert "Amount being confirmed" in sheet, "pending money isn't shown as being confirmed"
    assert "Total charged to client" not in sheet
    assert not OWES.search(sheet), "owes wording on the event sheet"
    assert not errors, f"console errors in the artist portal: {errors}"
    ctx.close()


def test_second_artists_gigs_never_appear(live_server, browser):
    """Eli's own gigs and amounts never show up in Benny's session (shared gigs aside)."""
    eli_ctx = _live_artist_context(browser)
    eli = eli_ctx.new_page()
    _sign_in(eli, live_server, "eli")
    eli_rows = _view_rows(eli)
    eli_ctx.close()
    if eli_rows["error"]:
        pytest.skip(f"artist views unavailable ({eli_rows['error'].strip()}) -- migration 0038 not applied yet?")

    ctx = _live_artist_context(browser)
    page = ctx.new_page()
    calls = _record_supabase(page)
    _sign_in(page, live_server, "benny")
    benny_ids = set(page.evaluate("S.events.map(e => e.id)"))
    eli_only = [g for g in eli_rows["gigs"] if (g["legacy_id"] or g["event_id"]) not in benny_ids]
    for view in ("a_gigs", "a_financials", "a_dashboard"):
        goto_nav(page, view, mobile=False)
        page.wait_for_timeout(250)
        text = page.locator("#app").inner_text()
        for g in eli_only:
            gid = g["legacy_id"] or g["event_id"]
            assert page.locator(f'[data-id="{gid}"]').count() == 0, f"Eli's gig {gid} appears in Benny's {view}"
            if g["client_name"]:
                assert g["client_name"] not in text, f"Eli's client appears in Benny's {view}"
    writes = [c for c in calls if (c["method"] not in ("GET", "HEAD", "OPTIONS") and "/auth/v1/" not in c["url"])
              or any(t in c["url"] for t in SHARED_TABLES)]
    assert not writes, f"artist session made write/shared-table calls: {writes}"
    ctx.close()
    if not eli_rows["gigs"]:
        pytest.skip("eli has no booked/paid gigs in artist_gig_view -- nothing of theirs to leak; isolation checked only structurally")
