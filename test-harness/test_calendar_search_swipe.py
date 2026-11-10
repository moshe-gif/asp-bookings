"""
Owner 2026-11-10 (v1.9.71):
- "can i search a date in the searchbar and it will open even if there are no other gigs": a date typed in the home
  search shows that day first ("Free" when nothing is booked) and opens it in the calendar's day view;
- "swipe days, weeks and months in the calendar like google calendar": a sideways swipe moves one step
  (left = next, right = back) in each view; a mostly-vertical move does nothing.
"""
from helpers import login_as, goto_nav, collect_console_errors


def test_search_a_date_opens_that_day(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.locator("[data-home-search]").first.fill("2099-02-17")
    row = page.locator('[data-testid="search-date"]')
    row.wait_for(state="visible")
    assert "Free" in row.inner_text()
    row.click()
    page.wait_for_function("() => S.view === 'calendar' && S.calViewMode === 'day'")
    assert page.get_by_text("Tuesday, February 17, 2099").first.is_visible()
    page.locator('[data-action="nav"][data-view="dashboard"]').first.click()
    page.wait_for_timeout(1000)   # the old screen's copy slides away first (page transition)
    page.locator("[data-home-search]").first.fill("feb 30")
    page.wait_for_timeout(300)
    assert page.locator('.content [data-testid="search-date"]').count() == 0, "an impossible date opened a day"
    assert not errors, f"console errors: {errors}"


def _swipe(page, dx, dy=0):
    page.evaluate("""([dx, dy]) => {
      const el = document.querySelector('.content .cal-head') || document.querySelector('.content');
      const r = el.getBoundingClientRect(), x = r.left + r.width/2, y = r.top + r.height/2 + 60;
      const t = (cx, cy) => new Touch({ identifier: 1, target: el, clientX: cx, clientY: cy });
      el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [t(x, y)], changedTouches: [t(x, y)] }));
      el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [t(x + dx, y + dy)] }));
    }""", [dx, dy])


def test_swipe_the_calendar(live_server, browser):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page = ctx.new_page()
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "calendar", mobile=True)
    page.evaluate("() => { S.calViewMode = 'month'; S.calMonth = new Date(2099, 0, 1); }")
    page.locator('[data-action="cal-today"]').first.wait_for()
    page.evaluate("() => { S.calMonth = new Date(2099, 0, 1); }")
    page.locator('[data-action="cal-next"]').first.click()           # draw February 2099
    page.get_by_text("February 2099").first.wait_for()
    _swipe(page, -120)
    page.get_by_text("March 2099").first.wait_for(timeout=3000)
    _swipe(page, 120)
    page.get_by_text("February 2099").first.wait_for(timeout=3000)
    _swipe(page, -30, 200)                                             # a scroll, not a swipe
    page.wait_for_timeout(300)
    assert page.evaluate("S.calMonth.getMonth()") == 1
    page.locator('[data-action="cal-view-mode"][data-mode="day"]').first.click()
    before = page.evaluate("S.calDate.toDateString()")
    _swipe(page, -120)
    page.wait_for_function(f"() => S.calDate.toDateString() !== {before!r}")
    page.locator('[data-action="cal-view-mode"][data-mode="week"]').first.click()
    wk = page.evaluate("S.calDate.getTime()")
    _swipe(page, 120)
    assert round((wk - page.evaluate("S.calDate.getTime()")) / 86400000) == 7
    ctx.close()
