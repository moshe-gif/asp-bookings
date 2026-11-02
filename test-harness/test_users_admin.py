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


def test_admin_cannot_raise_own_power(live_server, page):
    # Security audit 2026-11-02 (migration 0076): a bookings admin can't make themselves CEO/COO, re-link a
    # login, or add a CEO, straight through the database API. Every attempt must be refused; nothing changes.
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.wait_for_function("() => window.S && S.user")
    out = page.evaluate("""async () => {
      const sb = window.supabaseClient, uid = (await sb.auth.getUser()).data.user.id;
      const self = await sb.from('admin_users').update({ role: 'admin_ceo' }).eq('user_id', uid).select('role');
      const relink = await sb.from('admin_users').update({ user_id: uid }).eq('role', 'admin_coo').select('id');
      const add = await sb.from('admin_users').insert({ name: 'Harness Fake CEO', email: 'harness-fake-ceo@aspmgmt.com', initials: 'HF', role: 'admin_ceo' }).select('id');
      const mine = await sb.from('admin_users').select('role').eq('user_id', uid).maybeSingle();
      return { self: !!self.error, relink: !!relink.error, add: !!add.error, role: mine.data && mine.data.role };
    }""")
    assert out == {"self": True, "relink": True, "add": True, "role": "admin_bookings"}, out


def test_artist_cannot_read_office_list(live_server, page):
    # Migration 0077: staff emails, roles and access flags are for the office only.
    page.goto(live_server)
    login_as(page, "benny")
    page.wait_for_function("() => window.S && S.user")
    rows = page.evaluate("async () => { const r = await window.supabaseClient.from('admin_users').select('email'); return r.error ? 'error' : r.data.length; }")
    assert rows in (0, "error"), rows
