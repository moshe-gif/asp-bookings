"""
2026-10-09 audit W1-5 — each office browser's localStorage is the only copy of its business data.
- Back up downloads every asp_* key; Restore MERGES a file in (adds missing records by id, never
  changes or deletes what the browser already has). The same path imports a prepared gig file.
- Contract version snapshots no longer nest the whole version history (stored data is cleaned up).
- A failed save (full/blocked storage) is reported instead of silently dropped.
"""
import json

from helpers import login_as, goto_nav, collect_console_errors, fake_gig, seed_events, EVENTS_LS_KEY, create_lead


def _open_settings(page):
    page.locator('[data-action="nav"][data-view="settings"]').first.click()
    page.locator('[data-action="download-backup"]').wait_for(state="visible")


def test_backup_then_restore_merges_without_touching_existing(live_server, page, browser, tmp_path):
    errors = collect_console_errors(page)
    seed_events(page, [fake_gig("EV-9201", "benny", "2027-07-01"), fake_gig("EV-9203", "yaakov", "2027-07-03")])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    _open_settings(page)
    with page.expect_download() as dl:
        page.locator('[data-action="download-backup"]').click()
    backup_path = tmp_path / "backup.json"
    dl.value.save_as(backup_path)
    backup = json.loads(backup_path.read_text())
    assert backup["format"] == "asp-local-backup"
    assert any(e["id"] == "EV-9201" for e in backup["data"][EVENTS_LS_KEY])

    # A different browser that already has its own (edited) gig.
    ctx = browser.new_context()
    page2 = ctx.new_page()
    seed_events(page2, [fake_gig("EV-9202", "eli", "2027-07-02"), fake_gig("EV-9201", "benny", "2027-07-01", clientName="Edited Locally")])
    page2.goto(live_server)
    login_as(page2, "admin_bookings")
    _open_settings(page2)
    page2.on("dialog", lambda d: d.accept())
    with page2.expect_navigation():
        page2.locator('#restoreFileInput').set_input_files(str(backup_path))
    events = page2.evaluate(f"() => JSON.parse(localStorage.getItem('{EVENTS_LS_KEY}'))")
    by_id = {e["id"]: e for e in events}
    assert set(by_id) == {"EV-9201", "EV-9202", "EV-9203"}, sorted(by_id)
    assert by_id["EV-9201"]["clientName"] == "Edited Locally", "restore overwrote a record this browser already had"
    ctx.close()
    assert not errors, f"console errors: {errors}"


def test_stored_contract_versions_are_cleaned_of_nested_history(live_server, page):
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.evaluate("""() => {
        const key = 'asp_mock_contracts_v1';
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        if (!list.length) return;
        list[0].versions = [{ versionNumber: 1, snapshot: { id: list[0].id, versions: [{ snapshot: { versions: [] } }], _supabaseId: 'x' }, renderedHtml: '<p>v1</p>' }];
        localStorage.setItem(key, JSON.stringify(list));
    }""")
    has_contract = page.evaluate("() => JSON.parse(localStorage.getItem('asp_mock_contracts_v1') || '[]').length > 0")
    if not has_contract:
        # Create one through the real UI so there is something to migrate.
        create_lead(page, "Snapshot Client", "2027-08-08", artist_id="benny")
        page.locator('[data-action="create-contract"]').click()
        page.locator('[data-action="pick-template-create"][data-template="standard"]').click()
        return test_stored_contract_versions_are_cleaned_of_nested_history(live_server, page)
    page.reload()
    login_as(page, "admin_bookings")
    snap = page.evaluate("() => JSON.parse(localStorage.getItem('asp_mock_contracts_v1'))[0].versions[0].snapshot")
    assert "versions" not in snap and "_supabaseId" not in snap, snap


def test_failed_save_is_reported_not_silent(live_server, page):
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.evaluate("() => { Storage.prototype.setItem = function(){ throw new DOMException('quota', 'QuotaExceededError'); }; }")
    create_lead(page, "Quota Client", "2027-09-09", artist_id="benny")
    page.locator('#toasts .toast', has_text="Could not save").first.wait_for(state="visible", timeout=5000)
