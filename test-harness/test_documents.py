"""
Real click-through of the general Documents builder (own nav tab, office/bookkeeping only):
- brand swap (ASP <-> SING Entertainment) via the Outside Bookings entry point
- "On behalf of {artist}" attribution when a document's subject is one of ASP's own artists
"""
from helpers import login_as, goto_nav, collect_console_errors


def test_document_brand_swap_from_outside_booking(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "outside_bookings", mobile=False)

    page.locator('[data-action="open-outside-doc-builder"]').first.click()

    page.locator('[data-action="pick-document-brand"][data-brand="sing"]').click()
    page.locator('[data-action="save-document"]').click()
    assert not errors, f"console errors while saving document: {errors}"

    sing_logo = page.locator('#documentPrintHost img[alt="SING Entertainment"]')
    assert sing_logo.count() == 1, "SING Entertainment logo not rendered after brand switch"
    sign_lines = page.locator("#documentPrintHost .doc-sign-line")
    assert sign_lines.count() == 2, "expected exactly two signature lines"
    assert "SING Entertainment" in sign_lines.nth(1).inner_text()

    page.locator('[data-action="pick-document-brand"][data-brand="asp"]').click()
    page.locator('[data-action="save-document"]').click()
    asp_mark = page.locator("#documentPrintHost .doc-letterhead .wordmark")
    assert asp_mark.count() == 1, "ASP wordmark not rendered after switching back from SING"
    assert page.locator('#documentPrintHost img[alt="SING Entertainment"]').count() == 0

    assert not errors, f"console errors during document brand-swap flow: {errors}"


def test_document_on_behalf_of_artist(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    # Shmili Landau only exists once real projects/roster are loaded (not in the base ARTISTS
    # array) -- same one-tap action used elsewhere in the app/tests for real data.
    page.get_by_text("Load real projects").click()

    goto_nav(page, "documents", mobile=False)
    page.locator('[data-action="open-new-document"]').click()

    # "One of Our Artists" is the default subject type -- just pick Shmili from the dropdown.
    page.locator('.document-subject-select').select_option(label="Shmili Landau")
    page.locator('[data-action="save-document"]').click()
    assert not errors, f"console errors while saving artist document: {errors}"

    sign_lines = page.locator("#documentPrintHost .doc-sign-line")
    assert sign_lines.count() == 2
    assert "On behalf of Shmili Landau" in sign_lines.nth(1).inner_text(), (
        "expected ASP-branded artist document to attribute to the artist, not just 'ASP Artist Management'"
    )
    # Letterhead stays ASP's own even though the document is "for" Shmili -- only the sender
    # line changes, per the confirmed design.
    assert page.locator("#documentPrintHost .doc-letterhead .wordmark").count() == 1

    assert not errors, f"console errors during artist-attribution document flow: {errors}"
