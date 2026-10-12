"""
One contract system (2026-10-09 audit 2.11). The Contract Builder's records are the contracts:
  - the Contracts page lists them (not the gigs) and a row opens the real contract document;
  - a contracted/booked gig with no contract record is listed separately with "Create Contract";
  - the old per-gig auto-generated agreement (its own terms, "booking fee" = deposit, a hardcoded
    $250 overtime line) can no longer be opened from the event sheet or the Contracts page.
Fictional data in the test browser only (shared sync is off).
"""
from helpers import login_as, goto_nav, collect_console_errors, create_lead, fake_gig, seed_events
from test_contract_builder import create_contract_from_lead


def test_contracts_page_lists_real_contracts_and_uncontracted_bookings(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, [fake_gig("EV-9101", "benny", "2099-05-05", clientName="Imported Booking Client")])
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "One System Client", "2099-06-06", artist_id="eli")
    sheet_text = page.locator(".sheet").first.inner_text()
    assert "View Contract" not in sheet_text and "Preview Draft Contract" not in sheet_text, \
        "event sheet still offers the old auto-generated contract"
    create_contract_from_lead(page, "standard")
    page.locator('#contractBuilderOverlayHost [data-action="close-contract-builder"]').first.click()
    page.evaluate("window.dispatchEvent(new PopStateEvent('popstate'))")

    goto_nav(page, "contracts")
    row = page.locator('tr[data-action="open-contract-doc"]', has_text="One System Client")
    assert row.count() == 1, "the new contract isn't listed on the Contracts page"
    assert "Draft" in row.inner_text()
    missing = page.locator('tr', has_text="Imported Booking Client")
    assert missing.count() == 1 and missing.locator('[data-action="create-contract"]').count() == 1, \
        "a booked gig without a contract record isn't listed with Create Contract"
    assert page.locator('[data-action="open-contract-from-list"]').count() == 0

    row.click()
    doc = page.locator("#contractBuilderPrintHost .doc")
    doc.wait_for(state="visible")
    assert "One System Client" in doc.inner_text(), "row didn't open that contract's document"
    assert not errors, f"console errors: {errors}"
