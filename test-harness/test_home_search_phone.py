"""
Owner 2026-11-12 (phone screenshot, "this is messed up"): on a phone, home search results squeezed each gig's
status pill beside a long name until it broke one letter per line. The status now sits under the gig's details
on its own line, so it always reads on one line.
"""
from helpers import login_as, collect_console_errors, seed_events, fake_gig


def test_search_status_reads_on_one_line_on_a_phone(live_server, browser):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    try:
        errors = collect_console_errors(page)
        seed_events(page, [fake_gig("EV-9301", "dovie", "2099-11-12", clientName="Avraham Belizon Sheva Brachos Longname",
                                    venue="Some Very Long Hall Name", city="Boca Raton", state="FL", balanceReceived=False)])
        page.goto(live_server)
        login_as(page, "admin_bookings")
        page.locator('[data-home-search]').fill("Avraham")
        pill = page.locator('[data-testid="search-status"]').first
        pill.wait_for(state="visible")
        box = pill.bounding_box()
        line = page.evaluate("(el)=>parseFloat(getComputedStyle(el).lineHeight)||parseFloat(getComputedStyle(el).fontSize)*1.4", pill.element_handle())
        assert box["height"] < line * 2 + 12, f"status pill wraps: {box['height']}px tall"
        vw = page.evaluate("()=>document.documentElement.clientWidth")
        assert box["x"] + box["width"] <= vw, f"status pill runs off the screen ({box}, width {vw})"
        assert not errors, f"console errors: {errors}"
    finally:
        ctx.close()
