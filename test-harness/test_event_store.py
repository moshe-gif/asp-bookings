"""
Navigation/data-layer refactor, Wave A (PR 11): the new updateEvent(id, patch, opts) primitive
in frontend/workspaces/asp.js -- a real revision check + visible save failures on top of the
existing getEvent()/saveEvents(). Proven here against 'mark-event-reviewed' (asp.js case
'mark-event-reviewed'), a clean single-field/single-save call site -- 'Mark Reviewed' on the
Needs Review triage queue (seeded demo data already has plenty of needsReview:true events, so
no lead creation needed).

Runs as admin_bookings.
"""
import json

from helpers import login_as, collect_console_errors, fake_gig, seed_events, EVENTS_LS_KEY

REVIEW_GIGS = [fake_gig(f"EV-90{i}", a, f"2027-04-0{i}", needsReview=True, status="lead", importNotes="(test import note)") for i, a in enumerate(["benny", "yaakov", "eli"], start=1)]


def _open_needs_review(page):
    # The "Review Now" banner/button only renders on the Leads page (renderLeadsPage), not
    # reachable directly from the dashboard's default landing view.
    page.locator('[data-action="nav"][data-view="leads"]').first.click()
    page.locator('[data-action="nav"][data-view="needs_review"]').first.click()


def test_mark_reviewed_still_works(live_server, page):
    errors = collect_console_errors(page)
    seed_events(page, REVIEW_GIGS)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _open_needs_review(page)

    rows = page.locator('[data-action="mark-event-reviewed"]')
    count_before = rows.count()
    assert count_before > 0, "seeded needs-review gigs didn't show"

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
    seed_events(page, REVIEW_GIGS)
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


def test_refused_edit_leaves_nothing_half_applied(live_server, page):
    """
    2026-10-09 audit 3.15: callers used to change the gig and write its activity-log line BEFORE
    asking updateEvent() to save. When the save was refused (another tab had changed the gig), the
    stale tab still showed the edit, and its next unrelated save quietly wrote the refused edit and
    a "Details updated" line over the other tab's version. Now the edit is one patch and log lines
    join the guarded write, so a refused save changes nothing.
    """
    errors = collect_console_errors(page)
    seed_events(page, REVIEW_GIGS)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _open_needs_review(page)

    page_b = page.context.new_page()
    page_b.goto(live_server)
    login_as(page_b, "admin_bookings")
    _open_needs_review(page_b)
    page_b.locator('[data-action="mark-event-reviewed"][data-id="EV-901"]').click()
    page_b.close()

    # Tab A (stale) edits the same gig's client name: refused.
    page.evaluate("location.hash = '#/leads'")
    page.wait_for_timeout(400)
    page.locator('[data-action="open-event"][data-id="EV-901"]').first.click()
    page.locator('[data-action="open-edit-event"]').click()
    page.locator('input[data-field="clientName"]').fill("Refused Edit Name")
    page.locator('[data-action="save-edit-event"]').click()
    assert page.get_by_text("changed elsewhere since you loaded it").first.is_visible(), "no conflict toast"
    assert page.evaluate("S.events.find(e => e.id === 'EV-901').clientName") != "Refused Edit Name", \
        "refused edit is still applied in memory"

    # An unrelated save in tab A must not carry the refused edit or its log line.
    page.evaluate("window.dispatchEvent(new PopStateEvent('popstate'))")
    _open_needs_review(page)
    page.locator('[data-action="mark-event-reviewed"][data-id="EV-902"]').click()
    stored = page.evaluate(f"JSON.parse(localStorage.getItem({json.dumps(EVENTS_LS_KEY)})).find(e => e.id === 'EV-901')")
    assert stored["clientName"] != "Refused Edit Name", "refused edit reached storage"
    assert not any("Details updated" in (l.get("text") or "") for l in stored.get("log", [])), \
        "refused edit's log line reached storage"
    assert not errors, f"console errors: {errors}"
