"""
"No sideways scrolling, anywhere" -- at 320 / 390 / 768 / 1440 px, on every view and every modal,
sheet and document family, with long names/emails, wedding band + additional-artist fields,
empty states and populated lists.

Root-only checks can pass while a modal scrolls sideways inside (that is how the New Lead modal
clipped the client email/phone fields), so overflow_probe.horizontal_overflow() inspects every
visible element, and horizontal_scroll_moves() actually tries to scroll each one sideways.

Isolation: the harness signs in to the PRODUCTION Supabase project. Every test browser here has
shared sync off (conftest), and block_production_writes() aborts any database/Edge Function call
that is not a plain read -- the test then asserts the shared tables were never touched. All data is
fictional and seeded into the test browser's own localStorage.
"""
import os
import pathlib
import pytest

from helpers import login_as, fake_gig, seed_events, dismiss_opener, create_project, create_outside_booking
from overflow_probe import (
    block_production_writes, horizontal_overflow, horizontal_scroll_moves, SHARED_TABLES,
)

WIDTHS = [320, 390, 768, 1440]
HEIGHT = 844
SHOTS = os.environ.get("ASP_OVERFLOW_SCREENSHOTS")  # optional dir: save a screenshot per screen

LONG_NAME = "Bartholomew Alexander Montgomery-Fitzgerald Rosenblum-Weissmandel III"
LONG_EMAIL = "bartholomew.alexander.montgomeryfitzgerald@an-extremely-long-domain-name-example.com"
LONG_VENUE = "The Grand Ateres Chaya Ballroom and Conference Center at Lakewood Crossing Plaza"
UNBROKEN = "Supercalifragilisticexpialidocious-Unbreakable-Token-With-No-Spaces-At-All-0123456789"


def _gigs():
    common = dict(clientName=LONG_NAME, clientEmail=LONG_EMAIL, clientPhone="(555) 555-5555 ext. 12345",
                  venue=LONG_VENUE, city="Lakewood Township Municipality", state="NJ", notes=UNBROKEN)
    return [
        fake_gig("EV-9001", "benny", "2099-03-03", status="lead", **common),
        fake_gig("EV-9002", "benny", "2099-03-04", status="booked", type="Wedding",
                 bandSize=12, bandLeader=LONG_NAME, additionalArtists=[{"artistId": "eli", "fee": 2500}],
                 flightNeeded=True, groundTransportNeeded=True, **common),
        fake_gig("EV-9003", "eli", "2099-03-05", status="booked", **common),
    ]


VIEWS_ADMIN = ["dashboard", "calendar", "leads", "needs_review", "artists", "financials", "outside_bookings",
               "documents", "contracts", "contract_builder", "messages", "projects", "pricing", "international",
               "daily_digest", "travel", "settings"]
VIEWS_ARTIST = ["a_dashboard", "a_calendar", "a_gigs", "a_financials", "a_travel", "a_projects", "settings"]

# Controls that open a modal / sheet / document / panel. Only openers: nothing here saves,
# sends or deletes (and any server write would be aborted by block_production_writes anyway).
OPENERS = [
    "open-new-lead", "open-ask-ai", "open-mobile-menu", "open-block-time", "open-day", "open-day-view",
    "open-event", "open-artist", "open-add-artist", "open-payee-profile-form", "open-new-project", "open-project",
    "open-new-invoice", "view-invoice", "open-new-outside-booking", "open-outside-booking-detail",
    "open-outside-doc-builder", "open-new-document", "open-document", "open-add-real-user", "open-edit-real-user",
    "open-contract-doc", "open-contract-builder", "open-travel-request",
]
# Second level: controls inside an open event sheet / New Lead modal.
NESTED = {
    "open-event": ["toggle-event-menu", "open-edit-event", "open-flight-form", "open-transport-form",
                   "open-dresscode-form", "open-giginfo-form", "view-giginfo", "view-itinerary", "create-contract",
                   "open-send-contract", "open-verify-deposit", "preview-reminder",
                   "toggle-add-charge", "view-contract-builder-doc", "open-travel-request"],
    "open-new-lead": ["toggle-additional-artist", "add-lead-charge", "pick-booking-kind"],
    "open-contract-builder": ["view-contract-builder-doc"],
    "open-outside-booking-detail": ["open-outside-doc-builder"],
}


def _goto_view(page, view):
    page.evaluate("v => { location.hash = '#/' + v; }", view)
    page.wait_for_timeout(380)  # page-slide transition (see goto_nav)


def _close_all(page):
    # The app's own back-navigation path: closes every overlay and re-renders the current view.
    page.evaluate("window.dispatchEvent(new PopStateEvent('popstate'))")
    page.wait_for_timeout(250)


def _click_action(page, action, scope=None):
    """Click the first visible control for `action` (inside the top-most overlay when scope='overlay').
    Returns False when the screen has no such control (e.g. an empty list)."""
    return page.evaluate(
        """([action, scope]) => {
            let root = document;
            if (scope === 'overlay') {
              const ovs = [...document.querySelectorAll('.overlay')];
              if (ovs.length) root = ovs[ovs.length - 1];
            }
            const els = [...root.querySelectorAll('[data-action="' + action + '"]')]
              .filter(el => { const r = el.getBoundingClientRect(); return r.width && r.height; });
            const el = els.find(e => !e.classList.contains('sel')) || els[0];
            if (!el) return false;
            el.click();
            return true;
        }""",
        [action, scope],
    )


def _check(page, where, problems, width):
    page.wait_for_timeout(250)
    if SHOTS:  # before the scroll attempt, so the shot shows what a person sees
        d = pathlib.Path(SHOTS); d.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(d / f"{width}_{where.replace('/', '_').replace(' ', '_')}.png"), full_page=False)
    found = horizontal_overflow(page)
    moved = horizontal_scroll_moves(page)
    if found or moved:
        problems.append({"width": width, "where": where, "overflow": found[:8], "scrolled": moved[:5]})


def _present(page, actions):
    return page.evaluate("""acts => acts.filter(a => [...document.querySelectorAll('[data-action="' + a + '"]')]
        .some(el => { const r = el.getBoundingClientRect(); return r.width && r.height; }))""", actions)


def _open(page, view, opener, ev_id=None):
    _close_all(page); _goto_view(page, view)
    if ev_id:
        return page.evaluate("""id => { const el = [...document.querySelectorAll('[data-action="open-event"][data-id="' + id + '"]')]
            .find(e => e.getBoundingClientRect().width); if (!el) return false; el.click(); return true; }""", ev_id)
    return _click_action(page, opener)


def _sweep(page, views, problems, width):
    """Every view, then every modal family once per width (from the first view that offers it), then
    the second-level controls inside it. Event sheets are opened for each seeded gig (lead, wedding)."""
    done = set()
    for view in views:
        _close_all(page); _goto_view(page, view)
        _check(page, view, problems, width)
        targets = [(o, None) for o in _present(page, OPENERS) if o != "open-event" and o not in done]
        for ev_id in ("EV-9001", "EV-9002"):
            if ev_id not in done and page.locator(f'[data-action="open-event"][data-id="{ev_id}"]').count():
                targets.append(("open-event", ev_id))
        for opener, ev_id in targets:
            done.add(ev_id or opener)
            if not _open(page, view, opener, ev_id):
                continue
            label = f"{view}+{opener}" + (f"({ev_id})" if ev_id else "")
            _check(page, label, problems, width)
            inner_list = _present(page, NESTED.get(opener, []))
            for inner in inner_list:
                if not _open(page, view, opener, ev_id):
                    break
                page.wait_for_timeout(150)
                if _click_action(page, inner, scope="overlay"):
                    _check(page, f"{label}+{inner}", problems, width)
    _close_all(page)


def _populate(page):
    """Fill the empty lists (projects, external events, a contract) through the real UI, in this
    test browser only -- shared sync is off and server writes are blocked."""
    create_project(page, "Studio Album Recording Sessions With An Exceptionally Long Project Title " + UNBROKEN, "benny")
    create_outside_booking(page, performer=LONG_NAME, client=LONG_VENUE, date="2099-04-04")
    _close_all(page); _goto_view(page, "leads")
    page.locator('[data-action="open-event"][data-id="EV-9001"]').first.click()
    if _click_action(page, "create-contract", scope="overlay"):
        page.wait_for_timeout(400)
        if page.locator('[data-action="pick-template-create"]').count():  # weddings skip the picker
            page.locator('[data-action="pick-template-create"]').first.click()
            page.wait_for_timeout(400)
    _close_all(page)


def _wedding_lead_variant(page, problems, width):
    """New Lead with a long client, Wedding type (band fields), an additional artist and a charge."""
    _goto_view(page, "dashboard")
    _click_action(page, "open-new-lead")
    modal = page.locator('[data-form="lead"]')
    modal.locator('[data-action="pick-artist"]').first.click()
    modal.locator('input[data-field="clientName"]').fill(LONG_NAME)
    page.locator('[data-form="lead"] select[data-action="pick-event-type"]').select_option("Wedding")
    page.wait_for_timeout(200)
    page.locator('[data-form="lead"] input[data-field="clientEmail"]').fill(LONG_EMAIL)
    page.locator('[data-form="lead"] input[data-field="venue"]').fill(LONG_VENUE)
    page.locator('[data-form="lead"] input[data-field="showAdditionalArtists"]').check()
    _click_action(page, "toggle-additional-artist", scope="overlay")
    _click_action(page, "add-lead-charge", scope="overlay")
    _check(page, "new-lead-wedding-long", problems, width)
    # every input and action in the modal must be inside the modal's visible width
    hidden = page.evaluate("""() => {
        const m = document.querySelector('[data-form="lead"]'); const mr = m.getBoundingClientRect();
        return [...m.querySelectorAll('input, select, textarea, button')].filter(el => {
          const r = el.getBoundingClientRect(); if (!r.width) return false;
          return r.left < mr.left - 1 || r.right > mr.right + 1;
        }).map(el => el.getAttribute('data-field') || el.getAttribute('data-action') || el.tagName);
    }""")
    if hidden:
        problems.append({"width": width, "where": "new-lead-wedding-long", "outside_modal": hidden})
    _close_all(page)


def _run(page, live_server, user_id, views, extra=None, populate=None):
    log = block_production_writes(page.context)
    seed_events(page, _gigs())
    page.set_viewport_size({"width": 1440, "height": HEIGHT})
    page.goto(live_server)
    login_as(page, user_id)
    dismiss_opener(page)
    # Prove isolation before driving anything: shared sync is off and a write never leaves the browser.
    assert page.evaluate("window.ASP_DISABLE_EVENT_SYNC === true"), "shared-sync guard missing"
    err = page.evaluate("""async () => { const r = await window.supabaseClient.from('isolation_probe').insert({ x: 1 });
        return r.error ? (r.error.message || 'error') : null; }""")
    assert err and log and log[-1]["blocked"] and log[-1]["method"] == "POST", "write guard did not block a write"
    if populate:
        populate(page)
    problems = []
    for width in WIDTHS:
        page.set_viewport_size({"width": width, "height": HEIGHT})
        page.wait_for_timeout(200)
        _sweep(page, views, problems, width)
        if extra:
            extra(page, problems, width)
    touched = [r for r in log if any(t in r["url"] for t in SHARED_TABLES)]
    assert not touched, f"isolation broken -- shared tables were requested: {touched[:5]}"
    assert not problems, "horizontal overflow:\n" + "\n".join(map(str, problems))


def test_admin_no_horizontal_overflow(live_server, page):
    _run(page, live_server, "admin_bookings", VIEWS_ADMIN, extra=_wedding_lead_variant, populate=_populate)


def test_artist_no_horizontal_overflow(live_server, page):
    _run(page, live_server, "benny", VIEWS_ARTIST)
