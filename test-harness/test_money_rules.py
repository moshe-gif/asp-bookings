"""
Owner money rules (2026-10-12, audit W2-2):
  - ASP commission is per artist: 15% by default, Dovie 10% (artists.commission_pct, migration
    0042). It prefills a new gig's commission; each gig keeps its own afterwards.
  - Overtime is covered in test_contract_builder.py::test_overtime_auto_suggest_and_travel_sentence.
Fictional data in the test browser only (shared sync is off).
"""
from helpers import login_as, collect_console_errors


def _new_lead(page, artist_id, client, price):
    page.locator('[data-action="open-new-lead"]').click()
    page.locator(f'[data-action="pick-artist"][data-id="{artist_id}"]').click()
    page.locator('input[data-field="clientName"]').fill(client)
    page.locator('input[data-field="date"]').fill("2099-07-07")
    page.locator('[data-form="lead"] input[data-field="price"]').fill(str(price))
    page.locator('[data-action="submit-lead"]').click()
    page.wait_for_timeout(300)
    return page.evaluate("c => S.events.find(e => e.clientName === c).commission", client)


def test_commission_uses_each_artists_rate(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.wait_for_function("() => (window.S && S.user) ? true : false")
    page.wait_for_timeout(1500)  # roster (with commission rates) loads right after sign-in

    assert _new_lead(page, "dovie", "Dovie Rate Client", 10000) == 1000, "Dovie's gig should prefill 10% commission"
    page.evaluate("window.dispatchEvent(new PopStateEvent('popstate'))")
    assert _new_lead(page, "benny", "Benny Rate Client", 10000) == 1500, "a standard artist's gig should prefill 15%"
    assert not errors, f"console errors: {errors}"
