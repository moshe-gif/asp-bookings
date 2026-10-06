"""
Navigation/data-layer refactor, PR 14: doAddProject() used to hard-block submission without an
artist (`if(!f.artistId){ toast('Pick an artist.'...); return; }`) even though migration 0020
already relaxed the DB-level NOT NULL on projects.artist_id -- a real UI/DB mismatch. A plain
"New Project" is now genuinely optional on artist (only the Recording Day batch flow still
requires one, since it's booking that artist's studio day); the New Project modal has an explicit
"None" option for this. Confirms the full create -> list -> detail path renders without crashing
for an artist-less project.

Runs as admin_bookings.
"""
from helpers import login_as, goto_nav, collect_console_errors


def test_create_general_project_without_an_artist(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "projects", mobile=False)

    page.locator('[data-action="open-new-project"]').click()
    modal = page.locator('[data-form="newproject"]')
    assert modal.is_visible(), "New Project modal didn't open"

    # Deliberately do NOT pick an artist -- click the explicit "None" tile instead.
    modal.locator('[data-action="pick-project-artist"][data-id=""]').click()
    modal.locator('input[data-field="title"]').fill("Test Harness General Project")
    page.locator('[data-action="confirm-add-project"]').click()

    assert page.get_by_text("Test Harness General Project").is_visible(), (
        "artist-less project wasn't created / project detail page didn't render"
    )
    assert page.get_by_text("None — general project").is_visible(), (
        "project detail page didn't show the no-artist state"
    )

    # Back to the board, with the "All Projects" filter so the artist-less card (and its avatar
    # fallback) actually renders -- this is exactly the code path that used to assume a.slot/a.name.
    goto_nav(page, "projects", mobile=False)
    assert page.get_by_text("Test Harness General Project").is_visible(), (
        "artist-less project missing from the All Projects board"
    )
    assert not errors, f"console errors creating/viewing an artist-less project: {errors}"
