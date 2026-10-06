"""
Navigation/data-layer refactor, Wave A (PR 11): the new updateEvent(id, patch, opts) primitive
in frontend/workspaces/asp.js -- a real revision check + visible save failures on top of the
existing getEvent()/saveEvents(). Proven here against 'mark-event-reviewed' (asp.js case
'mark-event-reviewed'), a clean single-field/single-save call site -- 'Mark Reviewed' on the
Needs Review triage queue (seeded demo data already has plenty of needsReview:true events, so
no lead creation needed).

Runs as admin_bookings.
"""
from helpers import login_as, collect_console_errors


def _open_needs_review(page):
    # The "Review Now" banner/button only renders on the Leads page (renderLeadsPage), not
    # reachable directly from the dashboard's default landing view.
    page.locator('[data-action="nav"][data-view="leads"]').first.click()
    page.locator('[data-action="nav"][data-view="needs_review"]').first.click()


def test_mark_reviewed_still_works(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _open_needs_review(page)

    rows = page.locator('[data-action="mark-event-reviewed"]')
    count_before = rows.count()
    assert count_before > 0, "no seeded needs-review gigs to test against — check demo data"

    rows.first.click()
    assert rows.count() == count_before - 1, "Mark Reviewed didn't remove the gig from the queue"
    assert not errors, f"console errors during mark-reviewed: {errors}"


def test_concurrent_mark_reviewed_surfaces_conflict_instead_of_silent_overwrite(live_server, page):
    """
    Two real tabs (same browser context -> same localStorage) both load the Needs Review queue;
    tab B marks a gig reviewed first (real click); tab A, still holding its now-stale in-memory
    copy of the SAME gig, tries to mark it reviewed too -- this must surface a conflict toast via
    updateEvent()'s revision check, not silently re-save tab A's stale view over tab B's write.
    """
    errors_a = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _open_needs_review(page)

    target_id = page.locator('[data-action="mark-event-reviewed"]').first.get_attribute("data-id")
    assert target_id, "could not find a needs-review gig id to target"

    # Tab B: a second real page sharing the same browser context/localStorage -- a real second
    # signed-in tab, not a raw storage shortcut.
    page_b = page.context.new_page()
    errors_b = collect_console_errors(page_b)
    page_b.goto(live_server)
    login_as(page_b, "admin_bookings")
    _open_needs_review(page_b)
    page_b.locator(f'[data-action="mark-event-reviewed"][data-id="{target_id}"]').click()
    assert page_b.get_by_text("Marked reviewed.").is_visible()
    page_b.close()

    # Tab A never reloaded -- its in-memory copy of this same gig still predates tab B's write.
    # Marking it reviewed from here must hit updateEvent()'s conflict path.
    page.locator(f'[data-action="mark-event-reviewed"][data-id="{target_id}"]').click()

    assert page.get_by_text("changed elsewhere since you loaded it").is_visible(), (
        "stale tab's mark-reviewed attempt did not surface the expected conflict toast"
    )
    assert not errors_a, f"console errors in tab A: {errors_a}"
    assert not errors_b, f"console errors in tab B: {errors_b}"
