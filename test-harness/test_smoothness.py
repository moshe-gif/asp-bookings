"""
Smooth use on a phone (owner 2026-11-01: "you cant click on the date and it will open up ... make each day a
little bigger" and "i noticed the screen flashing and glitching ... make sure it stops that").

- Phone month view: each day is big enough to tap, and a tap anywhere in the day -- on a gig chip too --
  opens that day (as on the iPhone), not a gig or a hidden "+".
- The screen is redrawn only when something changed: nothing redraws while the app sits idle, and a burst of
  changes from the server is drawn once, not once per list (shared sync is off in the harness, so that part
  is checked on the live app; the harness checks idle and returning to the app).
"""
import datetime

from helpers import login_as, fake_gig, seed_events, collect_console_errors, no_shared_sync

REBUILDS = """() => { window.__rebuilds = 0; new MutationObserver(ms => { for (const m of ms) if (m.target.id === 'app' && m.addedNodes.length) window.__rebuilds++; }).observe(document.getElementById('app'), { childList: true }); }"""


def test_phone_calendar_day_opens_on_tap(live_server, browser):
    # A real phone: touch screen, no mouse hover (the tap-the-day rule is for touch screens only).
    ctx = no_shared_sync(browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True))
    page = ctx.new_page()
    day = datetime.date.today().replace(day=15).isoformat()
    seed_events(page, [fake_gig("EV-9401", "benny", day, status="booked", time="19:00"),
                       fake_gig("EV-9402", "benny", day, status="booked", time="21:00")])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    errors = collect_console_errors(page)
    page.evaluate("() => { location.hash = '#/calendar'; }")
    cell = page.locator(f'.cal-cell[data-date="{day}"]')
    cell.wait_for(state="visible", timeout=15000)
    page.wait_for_timeout(2500)  # sign-in loads (roster, inbox, statuses) land; each may redraw once if it changes the screen
    box = cell.bounding_box()
    assert box["height"] >= 58, box
    # Tap right on a gig chip: the day opens (not the gig, not "add").
    b = cell.locator(".cal-evt").first.bounding_box()
    page.evaluate(REBUILDS)
    page.wait_for_timeout(1500)
    assert page.evaluate("window.__rebuilds") == 0, "the calendar keeps redrawing"
    page.touchscreen.tap(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2)
    page.wait_for_function("() => S.calViewMode === 'day'", timeout=5000)
    assert page.evaluate("S.eventId") in (None, "")
    assert page.evaluate("() => { const d = S.calDate; return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }") == day
    assert page.locator(".chooser-row").count() == 2
    assert not errors, errors
    ctx.close()


def test_no_redraws_when_nothing_changes(live_server, page):
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.wait_for_timeout(2000)
    page.evaluate(REBUILDS)
    page.wait_for_timeout(8000)
    assert page.evaluate("window.__rebuilds") == 0, "the screen redrew while the app sat idle"
    # Coming back to the app (what a phone does after another app was open) redraws nothing when nothing changed.
    page.evaluate("() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); }")
    page.wait_for_timeout(3000)
    assert page.evaluate("window.__rebuilds") == 0, "the screen redrew on returning to the app"


def test_every_page_draws_fast_with_300_gigs(live_server, page):
    # Speed budget: with 300 gigs (more than a year of bookings) every menu page is drawn within 250 ms on the
    # test machine (measured 2026-11-02: 6-53 ms). A change that makes a page slow fails here first.
    import random
    random.seed(1)
    base = datetime.date(2026, 11, 1)
    gigs = [fake_gig(f"EV-{9600 + i}", random.choice(["benny", "baruch", "eli", "moshe", "yaakov"]),
                     (base + datetime.timedelta(days=random.randint(-60, 365))).isoformat(),
                     status=random.choice(["lead", "contract_sent", "booked", "paid"])) for i in range(300)]
    seed_events(page, gigs)
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.wait_for_function("() => window.S && S.user")
    page.wait_for_timeout(2500)
    views = page.evaluate("() => [...new Set([...document.querySelectorAll('.rail-link[data-view], .bn-item[data-view]')].map(e => e.getAttribute('data-view')))]")
    slow = {}
    for v in views:
        ms = page.evaluate("""v => new Promise(res => { const t = performance.now(); location.hash = '#/' + v;
            requestAnimationFrame(() => requestAnimationFrame(() => res(performance.now() - t))); })""", v)
        page.wait_for_timeout(300)
        if ms > 250:
            slow[v] = round(ms)
    assert len(views) >= 5, views
    assert not slow, f"pages slower than 250 ms: {slow}"
