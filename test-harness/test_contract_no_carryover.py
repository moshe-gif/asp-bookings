"""
Owner question 2026-11-12: "do contracts auto fill correctly and not from the previous contract?"
A contract is filled from its own gig and its own artist's profile. Here contract A is made and hand-edited
(email, fee, hours, notes); then contract B is made for a different client and artist, and none of
A's typed values may show up in B -- every field must come from B's gig.
Fictional data in the test browser only (shared sync is off).
"""
from helpers import login_as, collect_console_errors, create_lead
from test_contract_builder import create_contract_from_lead


def _val(builder, field):
    return builder.locator(f'[data-contract-field="{field}"]').first.input_value()


def test_second_contract_carries_nothing_from_the_first(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")

    create_lead(page, "First Contract Client", "2099-03-03", artist_id="eli")
    a = create_contract_from_lead(page, "standard")
    typed = {
        "snapshot.clientEmail": "first-only@example.com",
        "fee.amount": "4321",
        "top.hoursOfEngagement": "9 hours FIRST",
        "notes": "FIRST ONLY NOTE",
    }
    for f, v in typed.items():
        el = a.locator(f'[data-contract-field="{f}"]').first
        el.fill(v)
        el.dispatch_event("change")
    page.locator('#contractBuilderOverlayHost [data-action="close-contract-builder"]').first.click()
    page.evaluate("window.dispatchEvent(new PopStateEvent('popstate'))")

    create_lead(page, "Second Contract Client", "2099-04-04", artist_id="baruch")
    b = create_contract_from_lead(page, "standard")
    assert _val(b, "snapshot.clientName") == "Second Contract Client"
    assert _val(b, "snapshot.eventDate") == "2099-04-04"
    for f, v in typed.items():
        assert _val(b, f) != v, f"{f} carried over from the previous contract: {v!r}"
    text = b.inner_text()
    for leak in ("First Contract Client", "first-only@example.com", "FIRST ONLY", "9 hours FIRST"):
        assert leak not in text, f"second contract shows {leak!r} from the first"

    # And A kept its own edits (they were saved to A, not lost or moved).
    stored = page.evaluate("""() => { for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i); if (/contract/i.test(k) && !/^asp_sync_/.test(k)) {
          try { const v = JSON.parse(localStorage.getItem(k)); if (Array.isArray(v)) return v; } catch (e) {} } } return []; }""")
    first = [c for c in stored if (c.get("snapshot") or {}).get("clientName") == "First Contract Client"]
    assert first and first[0]["snapshot"]["clientEmail"] == "first-only@example.com", "contract A lost its edits"
    assert not errors, f"console errors: {errors}"
