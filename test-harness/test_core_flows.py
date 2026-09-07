"""
Phase 1: a few real write-flows, asserting the created state actually appears after the action —
genuine end-to-end (real clicks, real typing, real re-render), not just "the page didn't crash."

All three run as admin_bookings, since these are admin-only actions today.
"""
from helpers import login_as, goto_nav, collect_console_errors


def test_create_lead(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    page.locator('[data-action="open-new-lead"]').click()
    page.locator('[data-action="pick-artist"][data-id="benny"]').click()
    page.locator('input[data-field="clientName"]').fill("Test Harness Client")
    page.locator('input[data-field="date"]').fill("2027-06-15")
    page.locator('[data-action="submit-lead"]').click()

    # doSubmitLead() opens the new event's sheet directly on success — assert it's really there.
    sheet = page.locator(".sheet")
    assert sheet.is_visible(), "event sheet didn't open after submitting a lead"
    assert "Test Harness Client" in sheet.inner_text(), "new lead's client name not in event sheet"
    assert not errors, f"console errors during create-lead flow: {errors}"


def test_add_sticky_note_item(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "projects", mobile=False)

    first_project = page.locator(".project-folder").first
    assert first_project.count(), "no seeded projects to test against — check demo data"
    first_project.click()

    page.locator('[data-action="add-board-card"]').last.click()  # "Blank Card" button
    board_input = page.locator(".board-item-input").last
    board_input.fill("Test harness sticky item")
    board_input.press("Enter")

    assert page.get_by_text("Test harness sticky item").is_visible(), (
        "typed sticky-note item didn't appear on the board"
    )
    assert not errors, f"console errors during add-sticky-note flow: {errors}"


def test_assign_task_to_person(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "projects", mobile=False)

    page.locator(".project-folder").first.click()

    # Add an internal person (defaults to Internal) so there's someone to assign to.
    page.locator(".person-refid-select").select_option("admin_ceo")
    page.locator('[data-form="person"] input[data-field="role"]').fill("Approver")
    page.locator('[data-action="add-person"]').click()

    # Add a task and assign it to the person we just added, via the real assignee <select>.
    page.locator('input[data-field="newTaskText"]').fill("Test harness task")
    page.locator(".new-task-assignee-select").select_option(label="ASP Office — CEO")
    page.locator('[data-action="add-task"]').click()

    task_row = page.locator(".log-item", has_text="Test harness task")
    assert task_row.is_visible(), "newly added task not visible in the Tasks list"
    assigned_select = task_row.locator(".task-assignee-select")
    assert assigned_select.input_value() != "", "task was added but is not assigned to anyone"
    assert not errors, f"console errors during assign-task flow: {errors}"
