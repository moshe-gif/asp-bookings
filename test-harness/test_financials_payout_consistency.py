"""
Navigation/data-layer refactor, PR 12: ev.balance used to be a stored field that the Financials
page's "All Jobs" table read raw, while its own "Artist Payouts — Gig Breakdown" table a few dozen
lines above already computed zelleBalance(e) = price-commission + chargesTotal(e) -- two different
Payout numbers for the same event on the same page whenever that event had a post-signing charge.
zelleBalance() is now the one function both tables (and every other payout total in the app) read
through. This reproduces the original bug scenario end to end and confirms both tables agree.

Runs as admin_bookings.
"""
from helpers import login_as, collect_console_errors


def test_all_jobs_and_artist_payouts_tables_agree_with_a_post_signing_charge(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    page.locator('[data-action="open-new-lead"]').click()
    page.locator('[data-action="pick-artist"][data-id="benny"]').click()
    page.locator('input[data-field="clientName"]').fill("Test Harness Payout Consistency")
    page.locator('input[data-field="date"]').fill("2027-05-10")
    page.locator('input[data-field="price"]').fill("4000")
    page.locator('[data-action="submit-lead"]').click()

    sheet = page.locator(".sheet")
    assert sheet.is_visible(), "event sheet didn't open after submitting a lead"

    # Lead -> contract_sent -> booked (deposit) -> balance received, so the event qualifies for
    # BOTH Financials tables ("All Jobs" = status booked/paid; "Artist Payouts" = balanceReceived).
    page.locator('[data-action="send-contract"]').click()
    page.locator('[data-action="mark-deposit"]').click()
    page.locator('[data-action="close-booking-confirmation"]').click()
    page.locator('[data-action="mark-balance"]').click()

    # A post-signing charge is the exact condition that exposed the original drift.
    page.locator('[data-action="toggle-add-charge"]').click()
    page.locator('[data-charge-preset]').select_option("Travel")
    page.locator('input[data-field="amount"]').fill("300")
    page.locator('[data-action="confirm-add-charge"]').click()

    # 4000 price, 15% commission -> 600, balance 3400, + 300 charge = 3700 payout.
    assert "$3,700" in sheet.inner_text(), "ledger payout did not include the post-signing charge"

    page.locator('[data-action="close-sheet"]').first.click()
    page.locator('[data-action="nav"][data-view="financials"]').first.click()

    all_jobs_row = page.locator("tr", has_text="Test Harness Payout Consistency")
    payout_cells = all_jobs_row.locator('td[data-label="Payout"]')
    assert payout_cells.count() >= 1, "could not find the event's row in the Financials tables"

    payouts = {cells.strip() for cells in payout_cells.all_inner_texts()}
    assert payouts == {"$3,700"}, (
        f"All Jobs and Artist Payouts tables disagree on this event's payout: {payouts}"
    )
    assert not errors, f"console errors during the payout-consistency flow: {errors}"
