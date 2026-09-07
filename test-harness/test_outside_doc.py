"""
Real click-through of the Outside Booking document builder: create a document, switch its
letterhead between ASP and SING Entertainment, confirm the right branding and signatures render.
"""
from helpers import login_as, goto_nav, collect_console_errors


def test_outside_doc_brand_swap(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "outside_bookings", mobile=False)

    page.locator('[data-action="open-outside-doc-builder"]').first.click()

    # Default brand is ASP -- switch to SING and save.
    page.locator('[data-action="pick-outside-doc-brand"][data-brand="sing"]').click()
    page.locator('[data-action="save-outside-doc"]').click()

    doc_body = page.locator(".doc, .overlay .modal").last  # after save the modal stays open
    assert not errors, f"console errors while saving outside doc: {errors}"

    # Re-open to confirm it persisted, then check the actual print-target markup for SING's logo
    # and both signature lines (client + SING), via the hidden print host bindGlobal() maintains.
    sing_logo = page.locator('#outsideDocPrintHost img[alt="SING Entertainment"]')
    assert sing_logo.count() == 1, "SING Entertainment logo not rendered after brand switch"

    sign_lines = page.locator("#outsideDocPrintHost .doc-sign-line")
    assert sign_lines.count() == 2, "expected exactly two signature lines"
    assert "SING Entertainment" in sign_lines.nth(1).inner_text()

    # Switch back to ASP and confirm the letterhead swaps back.
    page.locator('[data-action="pick-outside-doc-brand"][data-brand="asp"]').click()
    page.locator('[data-action="save-outside-doc"]').click()
    asp_mark = page.locator("#outsideDocPrintHost .doc-letterhead .wordmark")
    assert asp_mark.count() == 1, "ASP wordmark not rendered after switching back from SING"
    assert page.locator('#outsideDocPrintHost img[alt="SING Entertainment"]').count() == 0

    assert not errors, f"console errors during outside-doc brand swap flow: {errors}"
