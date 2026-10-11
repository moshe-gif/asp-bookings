"""
Settings → Users: an admin can remove a person (admin-remove-user Edge Function deletes their
login, and their roster row unless history references them). This spec only checks the control and
that cancelling the confirmation changes nothing -- the harness never removes real accounts.
"""
from helpers import login_as, collect_console_errors


def test_remove_person_button_and_cancel_is_harmless(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.locator('[data-action="nav"][data-view="settings"]').first.click()
    edit = page.locator('[data-action="open-edit-real-user"]').first
    edit.wait_for(state="visible", timeout=20000)
    before = page.locator('[data-action="open-edit-real-user"]').count()
    edit.click()
    remove = page.locator('[data-action="remove-real-user"]')
    assert remove.is_visible(), "no Remove button on the edit screen"
    page.once("dialog", lambda d: d.dismiss())
    remove.click()
    page.wait_for_timeout(500)
    assert page.locator('[data-action="remove-real-user"]').is_visible(), "edit screen closed after cancelling"
    page.locator('[data-action="close-edit-real-user"]').first.click()
    assert page.locator('[data-action="open-edit-real-user"]').count() == before
    assert not errors, f"console errors: {errors}"
