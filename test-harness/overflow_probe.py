"""
Layout measurement for the "no sideways scrolling, anywhere" rule (test_no_horizontal_overflow.py).

`horizontal_overflow(page)` reports every way content can end up wider than its box:
  - the document itself scrolls sideways (scrollWidth > clientWidth);
  - a visible element that is a scroll container (overflow-x auto/scroll -- note overflow-y:auto
    alone makes overflow-x auto too, which is how modals turned into sideways scrollers) has
    content wider than itself;
  - a visible element whose overflow is hidden/clip conceals content wider than itself (clipping is
    not a fix), except deliberate one-line ellipsis text;
  - a visible element pokes out past the right/left edge of the viewport.
and then actually tries to scroll each of them sideways, which must not move anything.

`block_production_writes(context)` is the isolation guard: the harness signs in to the PRODUCTION
Supabase project, so this aborts (and records) every database/Edge Function call that is not a
plain read. Auth (sign-in) is allowed. A test asserts the recorded list is empty of shared-data
writes and that the shared tables were never even requested.
"""

MEASURE_JS = r"""
() => {
  const vw = document.documentElement.clientWidth;
  const out = [];
  const name = el => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3);
    if (cls.length) s += '.' + cls.join('.');
    const da = el.getAttribute('data-action') || el.getAttribute('data-field') || el.getAttribute('data-form');
    if (da) s += '[' + da + ']';
    return s;
  };
  const visible = el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 1) out.push({ kind: 'document', el: 'html', sw: de.scrollWidth, cw: de.clientWidth });
  if (document.body.scrollWidth > document.body.clientWidth + 1) out.push({ kind: 'document', el: 'body', sw: document.body.scrollWidth, cw: document.body.clientWidth });
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue;
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    if (el.closest('.content-exit-clone, #opener, [aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    // Off-screen panels that slide in (e.g. a closed drawer) are positioned outside on purpose.
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 || r.left < -1) {
      // ignore things inside a clipping ancestor that is itself on-screen (they are reported via that ancestor)
      out.push({ kind: 'offscreen', el: name(el), left: Math.round(r.left), right: Math.round(r.right), vw });
    }
    const ox = cs.overflowX;
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') continue; // text scrolls inside its own field
    if (el.scrollWidth <= el.clientWidth + 1) continue;
    if (ox === 'auto' || ox === 'scroll') out.push({ kind: 'scroller', el: name(el), sw: el.scrollWidth, cw: el.clientWidth });
    else if (ox === 'hidden' || ox === 'clip') {
      const ellipsis = cs.textOverflow === 'ellipsis' && cs.whiteSpace === 'nowrap';
      if (!ellipsis) out.push({ kind: 'clipped', el: name(el), sw: el.scrollWidth, cw: el.clientWidth });
    }
  }
  return out;
}
"""

# Tries to move the page and every element that could scroll sideways; returns what moved.
SCROLL_ATTEMPT_JS = r"""
() => {
  const moved = [];
  window.scrollTo(400, window.scrollY);
  if (window.scrollX !== 0) moved.push({ el: 'window', x: window.scrollX });
  window.scrollTo(0, window.scrollY);
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (/^(input|textarea|select)$/i.test(el.tagName)) continue; // a long value scrolls inside its own field
    // Only what a person can scroll: overflow hidden/clip boxes are reported by MEASURE_JS as 'clipped'.
    if (!/^(auto|scroll)$/.test(getComputedStyle(el).overflowX)) continue;
    const before = el.scrollLeft;
    el.scrollLeft = before + 400;
    if (el.scrollLeft !== before) {
      moved.push({ el: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0,3).join('.') : ''), x: el.scrollLeft });
      el.scrollLeft = before;
    }
  }
  return moved;
}
"""

SHARED_TABLES = ("/rest/v1/events", "/rest/v1/app_records")


def block_production_writes(context):
    """Abort every non-read call to the production database/Edge Functions; return the log of what
    was attempted ({method, url, blocked}) so a test can assert nothing slipped through."""
    log = []

    def handle(route, request):
        url, method = request.url, request.method
        is_supabase = ".supabase.co/" in url
        if not is_supabase:
            return route.continue_()
        if "/auth/v1/" in url:
            log.append({"method": method, "url": url.split("?")[0], "blocked": False})
            return route.continue_()
        if method in ("GET", "HEAD", "OPTIONS") and "/functions/v1/" not in url:
            log.append({"method": method, "url": url.split("?")[0], "blocked": False})
            return route.continue_()
        log.append({"method": method, "url": url.split("?")[0], "blocked": True})
        return route.abort()

    context.route("**/*", handle)
    return log


def horizontal_overflow(page):
    return page.evaluate(MEASURE_JS)


def horizontal_scroll_moves(page):
    # A real sideways wheel/trackpad gesture too, not only programmatic scrollLeft.
    page.mouse.move(page.viewport_size["width"] // 2, page.viewport_size["height"] // 2)
    page.mouse.wheel(400, 0)
    page.wait_for_timeout(120)
    moved = page.evaluate(SCROLL_ATTEMPT_JS)
    return moved
