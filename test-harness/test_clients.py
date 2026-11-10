"""
Clients list (owner 2026-11-09: "a Clients list (one client -> many gigs)"), v1.9.69.

The list is worked out from the gigs (nothing stored): gigs that share an email, a phone number, or the
exact full name are one client. Seeds four fictional gigs (no sync):
- Zelda Testerman: two gigs by email (one typed in capitals) + a third matched only by phone;
- a different client with no shared detail stays separate;
then checks the list row, the search, the client page (both upcoming and past gigs) and its URL.
"""
from helpers import login_as, goto_nav, seed_events, fake_gig, collect_console_errors


def test_clients_list_groups_gigs_by_client(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, [
        fake_gig("EV-9601", "benny", "2099-03-01", clientName="Zelda Testerman", clientEmail="zelda@example.com", clientPhone="(212) 555-0101"),
        fake_gig("EV-9602", "eli", "2099-05-01", clientName="Zelda T.", clientEmail="ZELDA@example.com", depositReceived=False),
        fake_gig("EV-9603", "benny", "2020-01-05", clientName="Mrs. Testerman", clientPhone="212-555-0101", balanceReceived=True, status="paid"),
        fake_gig("EV-9604", "benny", "2099-04-01", clientName="Yosef Otherclient", clientEmail="yosef@example.com"),
    ])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "clients")
    page.locator('[data-testid="clients-list"]').wait_for(state="visible")

    page.locator("[data-client-search]").fill("zelda@")
    rows = page.locator('[data-testid="client-row"]')
    assert rows.count() == 1, rows.all_inner_texts()
    row = rows.first.inner_text()
    assert "Zelda" in row and "3" in row, row
    # still owed: EV-9602 has no deposit yet (full 10,000) + EV-9601 balance due after its deposit
    assert "$" in row

    page.locator("[data-client-search]").fill("Otherclient")
    assert page.locator('[data-testid="client-row"]').count() == 1
    assert "Zelda" not in page.locator('[data-testid="client-row"]').first.inner_text()

    page.locator("[data-client-search]").fill("zelda@")
    page.locator('[data-testid="client-row"]').first.click()
    detail = page.locator('[data-testid="client-detail"]')
    detail.wait_for(state="visible")
    text = detail.inner_text()
    assert "Upcoming (2)" in text and "Past (1)" in text, text
    assert "zelda@example.com" in text.lower()
    assert "#/client_detail/" in page.url
    for gid in ("EV-9601", "EV-9602", "EV-9603"):
        assert page.locator(f'[data-testid="client-detail"] [data-action="open-event"][data-id="{gid}"]').count() == 1
    assert page.locator('[data-testid="client-detail"] [data-action="open-event"][data-id="EV-9604"]').count() == 0

    page.reload()
    page.locator('[data-testid="client-detail"]').wait_for(state="visible", timeout=20000)
    assert not errors, f"console errors: {errors}"


def test_calendar_month_with_a_no_time_gig_still_shows(live_server, page):
    # Owner 2026-11-10: "there's no january in the app" -- two gigs on one day, one with no time yet, crashed the
    # time sort and the whole month never drew (the arrow stayed on December).
    from helpers import seed_events, fake_gig
    errors = collect_console_errors(page)
    seed_events(page, [fake_gig("EV-9611", "benny", "2099-01-05", clientName="Timed Client"),
                       fake_gig("EV-9612", "eli", "2099-01-05", clientName="No Time Client", time=None)])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "calendar")
    page.evaluate("() => { S.calViewMode = 'month'; S.calMonth = new Date(2098, 11, 1); }")
    page.locator('[data-action="cal-next"]').first.click()
    page.get_by_text("January 2099").first.wait_for(state="visible", timeout=5000)
    assert page.locator('[data-action="open-event"][data-id="EV-9612"], [data-id="EV-9612"]').count() >= 1
    assert not errors, f"console errors: {errors}"
