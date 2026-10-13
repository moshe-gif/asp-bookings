"""
Real click-through of the general Documents builder (own nav tab, office/bookkeeping only):
- ASP-only letterhead (SING Entertainment removed 2026-10-13) via the Other Bookings entry point
- "On behalf of {artist}" attribution when a document's subject is one of ASP's own artists
"""
from helpers import login_as, goto_nav, collect_console_errors, create_outside_booking


def test_document_from_other_booking_is_asp_only(live_server, page):
    """SING Entertainment was removed (owner 2026-10-13): documents are ASP-only, no letterhead picker."""
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    create_outside_booking(page)

    page.locator('[data-action="open-outside-doc-builder"]').first.click()
    assert page.locator('[data-action="pick-document-brand"]').count() == 0, "letterhead picker still offered"
    page.locator('[data-action="save-document"]').click()
    assert page.locator("#documentPrintHost .doc-letterhead .wordmark").count() == 1, "ASP wordmark missing"
    assert "SING" not in page.locator("#documentPrintHost").inner_text()
    assert page.locator("#documentPrintHost .doc-sign-line").count() == 2, "expected exactly two signature lines"
    assert not errors, f"console errors while saving document: {errors}"


def test_document_on_behalf_of_artist(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    goto_nav(page, "documents", mobile=False)
    page.locator('[data-action="open-new-document"]').click()

    # "One of Our Artists" is the default subject type -- just pick Baruch from the dropdown
    # (base ARTISTS array, no extra loading needed -- "Load real projects" was a prototype
    # localStorage-migration button, removed from production nav, see navigation/data-layer
    # refactor PR 18's follow-up cleanup).
    page.locator('.document-subject-select').select_option(label="Baruch Levine")
    page.locator('[data-action="save-document"]').click()
    assert not errors, f"console errors while saving artist document: {errors}"

    sign_lines = page.locator("#documentPrintHost .doc-sign-line")
    assert sign_lines.count() == 2
    assert "On behalf of Baruch Levine" in sign_lines.nth(1).inner_text(), (
        "expected ASP-branded artist document to attribute to the artist, not just 'ASP Artist Management'"
    )
    # Letterhead stays ASP's own even though the document is "for" Shmili -- only the sender
    # line changes, per the confirmed design.
    assert page.locator("#documentPrintHost .doc-letterhead .wordmark").count() == 1

    assert not errors, f"console errors during artist-attribution document flow: {errors}"
