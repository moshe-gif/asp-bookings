"""
Owner 2026-11-09, after the first real test run (Ilan as the client):
- The signing page's Pay section didn't work: a page-wide `iframe{min-height:400px;background:...}` rule meant
  for the contract's frame also hit Stripe's own (hidden) iframes and covered the card fields with a blank box.
  Stripe is live, so test_client_payments never reaches the card form; this checks the cause directly.
- "cut down on the size of the asp logo in every area", "always ... the dark logo on the light background",
  and "add the artists name in big at the top of the page in a classy font".
- On the phone, the red count badges on the bottom nav were cut off.
"""
import pytest
from helpers import login_as, collect_console_errors, create_lead, pick_template, goto_nav, seed_events, fake_gig


@pytest.mark.parametrize("path", ["sign/", "pay/"])
def test_only_the_document_frame_is_styled_not_stripes(live_server, page, path):
    page.goto(f"{live_server}/{path}#bad")
    page.wait_for_timeout(300)
    css = page.evaluate("""() => {
      const pay = document.createElement('div'); pay.id = 'pay';
      const stripe = document.createElement('iframe'); pay.appendChild(stripe); document.body.appendChild(pay);
      const doc = document.createElement('div'); doc.id = 'doc';
      const own = document.createElement('iframe'); doc.appendChild(own); document.body.appendChild(doc);
      const s = getComputedStyle(stripe), o = getComputedStyle(own);
      return { stripeMin: s.minHeight, stripeBg: s.backgroundColor, ownMin: o.minHeight };
    }""")
    assert css["stripeMin"] in ("0px", "auto"), f"a page rule sizes Stripe's iframes: {css}"
    assert css["stripeBg"] in ("rgba(0, 0, 0, 0)", "transparent"), f"a page rule paints over Stripe's iframes: {css}"
    assert css["ownMin"] not in ("0px", "auto"), "the document's own frame lost its height"


def test_pay_form_uses_the_option_this_stripe_js_accepts():
    import pathlib
    js = (pathlib.Path(__file__).parent.parent / "frontend/sign/pay.js").read_text()
    # Stripe.js endive throws on the older `paymentMethodTypes` option and the card form never loads (2026-11-09).
    assert "allowedPaymentMethodTypes:['card', 'us_bank_account']" in js
    assert " paymentMethodTypes:" not in js and "{paymentMethodTypes" not in js


def test_contract_header_is_light_with_small_logo_and_artist_name(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    page.emulate_media(color_scheme="dark")
    login_as(page, "admin_bookings")
    create_lead(page, "Header Client", "2027-09-20", artist_id="eli")
    page.locator('[data-action="create-contract"]').click()
    pick_template(page, "standard")
    builder = page.locator('#contractBuilderOverlayHost .sheet')
    builder.wait_for(state='visible')
    builder.locator('[data-action="view-contract-builder-doc"]').first.click()
    body = page.locator('.doc-body:visible').first
    body.wait_for(state='visible')
    html = body.inner_html()
    assert 'asp-horizontal-light.png' not in html, "white logo / dark band still on the contract"
    name = body.locator('.artist-name').first
    assert name.is_visible()
    style = name.get_attribute("style") or ""   # inline on purpose: emails and the frozen contract HTML carry it too
    assert 'Cormorant' in style and 'font-size:40px' in style, style
    widths = page.evaluate("() => [...document.querySelectorAll('.doc-body img[src*=\"asp-horizontal\"]')].map(i => i.getBoundingClientRect().width)")
    assert widths and max(widths) <= 120, f"logo too big: {widths}"
    # Paper stays white in the dark theme.
    # (polled: the builder re-renders, and a replaced node reads as an empty style)
    page.wait_for_function("() => { const b = [...document.querySelectorAll('.doc-body')].find(e => e.offsetParent); return b && getComputedStyle(b).backgroundColor === 'rgb(255, 255, 255)'; }", timeout=5000)
    assert not errors, f"console errors: {errors}"


def test_send_contract_subject_is_artist_via_asp(live_server, page):
    page.goto(live_server)
    login_as(page, "admin_bookings")
    create_lead(page, "Subject Client", "2027-09-21", artist_id="eli")
    page.locator('[data-action="create-contract"]').click()
    pick_template(page, "standard")
    page.locator('#contractBuilderOverlayHost .sheet').wait_for(state='visible')
    page.locator('#contractBuilderOverlayHost .sheet [data-action="view-contract-builder-doc"]').first.click()
    page.locator('[data-action="open-send-contract"]').first.click()
    box = page.locator('input[data-field="subject"]')
    box.wait_for(state='visible')
    subj = box.input_value()
    assert subj.endswith(" via ASP") and len(subj) > len(" via ASP"), subj


def test_phone_nav_badge_is_not_clipped(live_server, page):
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(live_server)
    login_as(page, "admin_bookings")
    item = page.locator('.bottom-nav .bn-item').first
    item.wait_for(state='visible')
    out = item.evaluate("""a => { const w = a.querySelector('.nav-icon-wrap'); const b = document.createElement('span');
      b.className = 'nav-badge'; b.textContent = '9+'; w.appendChild(b);
      const wr = w.getBoundingClientRect(), br = b.getBoundingClientRect();
      return { overflow: getComputedStyle(w).overflow, badgeOutside: br.right > wr.right || br.top < wr.top }; }""")
    assert out["overflow"] == "visible", f"the icon wrapper clips its badge: {out}"


def test_occasion_fills_standard_hours_unless_typed(live_server, page):
    # Owner 2026-11-09: "when i click wedding on the contract, it fills in amount of time".
    page.goto(live_server)
    login_as(page, "admin_bookings")
    create_lead(page, "Hours Client", "2027-09-22", artist_id="eli")
    page.locator('[data-action="create-contract"]').click()
    pick_template(page, "standard")
    b = page.locator('#contractBuilderOverlayHost .sheet')
    b.wait_for(state='visible')
    occ, hrs = b.locator('[data-testid="contract-occasion"]'), b.locator('[data-testid="contract-hours"]')
    occ.fill("Concert"); occ.blur()
    assert b.locator('[data-testid="contract-hours"]').input_value().startswith("2.5 hour show")
    occ = b.locator('[data-testid="contract-occasion"]'); occ.fill("Wedding"); occ.blur()
    assert b.locator('[data-testid="contract-hours"]').input_value() == "5 hours"
    hrs = b.locator('[data-testid="contract-hours"]'); hrs.fill("6 hours"); hrs.blur()
    occ = b.locator('[data-testid="contract-occasion"]'); occ.fill("Bar Mitzvah"); occ.blur()
    assert b.locator('[data-testid="contract-hours"]').input_value() == "6 hours", "hand-typed hours were replaced"


def test_admin_changes_gig_status_from_the_gig_page(live_server, page):
    # Owner 2026-11-09: "i need to be able to change a status of a gig from in the gig page as administrator".
    errors = collect_console_errors(page)
    seed_events(page, [fake_gig("EV-9801", "benny", "2099-06-01", clientName="Status Client", status="lead")])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "leads")
    page.locator('[data-action="open-event"][data-id="EV-9801"]').first.click()
    sel = page.locator('.sheet [data-testid="gig-status-select"]')
    sel.wait_for(state='visible')
    page.once("dialog", lambda d: d.accept())
    sel.select_option("booked")
    page.wait_for_function("() => true")
    page.wait_for_timeout(300)
    assert page.locator('.sheet [data-testid="gig-status-select"]').input_value() == "booked"
    assert "Booked" in page.locator('.sheet .sheet-head').inner_text()
    assert not errors, f"console errors: {errors}"
