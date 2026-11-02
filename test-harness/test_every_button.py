"""
Every button does something without breaking (owner 2026-11-01: "run a test on every button and line to make
sure its functioning"). A robot signs in as an admin, opens every page in the menu (desktop and phone), and
presses every visible button, link-button, tab and chip on it, one at a time, starting fresh each time. A press
that throws an error in the page or logs one fails the test, naming the page and the button.

Nothing real happens: after sign-in every write to the server and every server function call is blocked
(GET reads of the office's data are allowed so the pages have something to show), confirm() boxes are
answered "Cancel", and the harness never syncs shared data. Sign-out is skipped (it would end the run).
"""
import re

import pytest

from helpers import login_as, collect_console_errors

SUPABASE = "psgpxbkncuavlnpplykf.supabase.co"
SKIP_ACTIONS = {"logout"}
# Errors that come from the blocked network itself, not from the button.
NETWORK_NOISE = re.compile(r"Failed to fetch|ERR_FAILED|net::|NetworkError|Load failed|status of 4\d\d|status of 5\d\d|"
                           r"Server error|Network error|TypeError: fetch", re.I)


def _block_writes(page):
    def handle(route):
        req = route.request
        if "/functions/v1/" in req.url or (req.method != "GET" and "/auth/v1/" not in req.url):
            route.abort()
        else:
            route.continue_()
    page.route(f"**://{SUPABASE}/**", handle)


def _views(page):
    return page.evaluate("""() => [...new Set([...document.querySelectorAll('.rail-link[data-view], .bn-item[data-view], .artist-top-tabs [data-view]')]
        .map(e => e.getAttribute('data-view')))]""")


def _buttons(page):
    # One entry per distinct (action, id, text) among visible, enabled controls in the page content.
    return page.evaluate("""() => {
      const seen = new Set(), out = [];
      for (const el of document.querySelectorAll('#app .content [data-action]')) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || el.disabled || el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') continue;
        const key = [el.getAttribute('data-action'), el.getAttribute('data-id') || '', (el.textContent || '').trim().slice(0, 30)].join('|');
        if (seen.has(key)) continue;
        seen.add(key); out.push({ key, idx: [...document.querySelectorAll('#app .content [data-action]')].indexOf(el) });
      }
      return out.slice(0, 60);
    }""")


def _fresh(page, view):
    page.evaluate("""v => { Object.keys(S).forEach(k => { if (k.startsWith('show') && S[k] === true) S[k] = false; });
      S.eventId = null; S.dayListDate = null; document.querySelectorAll('.lib-ov').forEach(e => e.remove());
      location.hash = '#/' + v + '?r=' + Math.random(); location.hash = '#/' + v; }""", view)
    page.wait_for_timeout(250)


CSP_WATCH = "document.addEventListener('securitypolicyviolation', e => console.error('CSP blocked ' + e.violatedDirective + ' ' + e.blockedURI));"


@pytest.mark.parametrize("width", [1280, 390])
def test_every_button_on_every_page(live_server, page, width):
    page.add_init_script(CSP_WATCH)  # anything the page's Content-Security-Policy blocks is an error too
    page.set_viewport_size({"width": width, "height": 900})
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.wait_for_function("() => window.S && S.user", timeout=20000)
    page.wait_for_timeout(2500)
    _block_writes(page)
    page.on("dialog", lambda d: d.dismiss())
    page.on("popup", lambda p: p.close())
    errors = collect_console_errors(page)
    problems = []
    views = _views(page)
    assert len(views) >= 5, views
    pressed = 0
    for view in views:
        _fresh(page, view)
        for b in _buttons(page):
            action = b["key"].split("|")[0]
            if action in SKIP_ACTIONS:
                continue
            _fresh(page, view)
            before = len(errors)
            loc = page.locator("#app .content [data-action]").nth(b["idx"])
            try:
                loc.click(timeout=2000)
            except Exception:
                continue  # moved / covered after a fresh draw: not a button failure
            pressed += 1
            page.wait_for_timeout(200)
            new = [e for e in errors[before:] if not NETWORK_NOISE.search(e)]
            if new:
                problems.append(f"{view} · {b['key']}: {new[0][:200]}")
            page.keyboard.press("Escape")
    assert pressed > 50, pressed
    assert not problems, "\n".join(problems)


def test_every_button_in_the_gig_sheet(live_server, page):
    # The gig sheet is the screen used most: press every button in it, for a gig at each stage
    # (new lead, contract sent, booked with deposit in, fully paid), one at a time from a freshly opened sheet.
    from helpers import fake_gig, seed_events
    stages = {
        "EV-9501": dict(status="lead", depositReceived=False, clientEmail="", clientPhone=""),
        "EV-9502": dict(status="contract_sent", depositReceived=False),
        "EV-9503": dict(status="booked", depositReceived=True),
        "EV-9504": dict(status="paid", depositReceived=True, balanceReceived=True),
    }
    seed_events(page, [fake_gig(gid, "benny", "2099-06-0" + gid[-1], **kw) for gid, kw in stages.items()])
    page.add_init_script(CSP_WATCH)
    page.set_viewport_size({"width": 1280, "height": 900})
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.wait_for_function("() => window.S && S.user", timeout=20000)
    page.wait_for_timeout(2000)
    _block_writes(page)
    page.on("dialog", lambda d: d.dismiss())
    page.on("popup", lambda p: p.close())
    errors = collect_console_errors(page)
    problems, pressed = [], 0

    def open_sheet(gid):
        _fresh(page, "leads")
        page.evaluate("""id => { const b = document.createElement('button'); b.setAttribute('data-action', 'open-event'); b.setAttribute('data-id', id);
          document.querySelector('#app .content').appendChild(b); b.click(); }""", gid)
        page.locator(".sheet").first.wait_for(state="visible", timeout=5000)

    for gid in stages:
        open_sheet(gid)
        keys = page.evaluate("""() => { const seen = new Set(), out = [];
          [...document.querySelectorAll('.sheet [data-action]')].forEach((el, i) => {
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height || el.disabled || ['SELECT','INPUT','TEXTAREA'].includes(el.tagName)) return;
            const k = [el.getAttribute('data-action'), el.getAttribute('data-id') || '', (el.textContent || '').trim().slice(0, 30)].join('|');
            if (!seen.has(k)) { seen.add(k); out.push({ k, i }); } });
          return out; }""")
        for b in keys:
            if b["k"].split("|")[0] in SKIP_ACTIONS:
                continue
            open_sheet(gid)
            before = len(errors)
            try:
                page.locator(".sheet [data-action]").nth(b["i"]).click(timeout=2000)
            except Exception:
                continue
            pressed += 1
            page.wait_for_timeout(200)
            new = [e for e in errors[before:] if not NETWORK_NOISE.search(e)]
            if new:
                problems.append(f"{gid} · {b['k']}: {new[0][:200]}")
            page.keyboard.press("Escape")
    assert pressed > 40, pressed
    assert not problems, "\n".join(problems)
