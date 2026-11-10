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
from helpers import login_as, collect_console_errors, create_lead, pick_template, goto_nav, seed_events, fake_gig, open_lead_contract


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
    open_lead_contract(page, "standard")
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
    assert 'Archivo' in style and 'font-weight:300' in style and 'font-size:40px' in style, style
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
    open_lead_contract(page, "standard")
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
    open_lead_contract(page, "standard")
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


def test_home_shows_this_weeks_gigs_with_whats_missing(live_server, page):
    # Owner 2026-11-09: the first thing on the home screen is "This week's gigs" with what's still missing.
    import datetime
    soon = (datetime.date.today() + datetime.timedelta(days=3)).isoformat()
    seed_events(page, [
        fake_gig("EV-9811", "benny", soon, clientName="Missing Bits Client", time="00:00", balanceReceived=False),
        fake_gig("EV-9812", "benny", soon, clientName="Ready Client", type="Concert", balanceReceived=True, status="paid"),
    ])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    card = page.locator('[data-testid="this-week"]')
    card.wait_for(state='visible')
    text = card.inner_text()
    assert "Missing Bits Client" in text and "Client form not filled in" in text and "No start time" in text
    assert "Ready Client" in text and "Ready" in text
    # Owner 2026-11-10: "i need singers name first" -- the bold first line of each row is the singer.
    assert card.locator('[data-testid="this-week-singer"]').first.inner_text().strip() == "Benny Friedman"


def test_phone_tab_bar_slides(live_server, page):
    # Owner 2026-11-10: "make the slider slidable like other apple apps": press, drag the bubble, let go.
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(live_server)
    login_as(page, "admin_bookings")
    nav = page.locator(".bottom-nav")
    nav.wait_for(state="visible")
    start = nav.locator('.bn-item[data-view="dashboard"]').bounding_box()
    end = nav.locator('.bn-item[data-view="leads"]').bounding_box()
    y = start["y"] + start["height"] / 2
    page.mouse.move(start["x"] + start["width"] / 2, y)
    page.mouse.down()
    for i in range(1, 11):
        page.mouse.move(start["x"] + start["width"] / 2 + (end["x"] - start["x"]) * i / 10, y)
    assert "bn-dragging" in (nav.get_attribute("class") or ""), "the bar didn't start sliding"
    slider_x = page.evaluate("document.querySelector('.bn-slider').getBoundingClientRect().left")
    assert slider_x > start["x"] + 20, "the bubble didn't follow the finger"
    page.mouse.up()
    page.wait_for_function("() => S.view === 'leads'")
    # a plain tap still works
    page.wait_for_timeout(400)
    nav.locator('.bn-item[data-view="calendar"]').click()
    page.wait_for_function("() => S.view === 'calendar'")


def test_riders_card_and_send_rider_on_the_gig(live_server, page):
    # Owner 2026-11-09: a rider per singer (esp. DJ Shmili), sent to the client on request from the gig.
    import json
    errors = collect_console_errors(page)
    seed_events(page, [fake_gig("EV-9821", "benny", "2099-07-01", clientName="Rider Client", clientEmail="rider@example.com"),
                       fake_gig("EV-9822", "eli", "2099-07-02", clientName="No Rider Client", clientEmail="x@example.com")])
    riders = {"benny": {"url": "https://example.com/benny-rider.pdf", "name": "Benny rider.pdf", "uploadedAt": "2026-11-09T00:00:00Z"}}
    page.context.add_init_script("(() => { const k = 'asp_mock_org_settings_v1'; let o = {}; try { o = JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) {} "
                                 f"if (!o.riders) {{ o.riders = {json.dumps(riders)}; localStorage.setItem(k, JSON.stringify(o)); }} }})()")
    page.goto(live_server)
    login_as(page, "admin_bookings")
    goto_nav(page, "settings")
    card = page.locator('[data-testid="riders-card"]')
    card.wait_for(state='visible', timeout=15000)
    assert card.locator('input[data-rider-upload="eli"]').count() == 1
    assert "Benny rider.pdf" in card.inner_text()
    goto_nav(page, "leads")
    page.locator('[data-action="open-event"][data-id="EV-9821"]').first.click()
    block = page.locator('.sheet [data-testid="rider-block"]')
    block.wait_for(state='visible')
    assert block.locator('[data-testid="send-rider"]').is_enabled()
    page.locator('.sheet [data-action="close-sheet"]').first.click()
    page.locator('.sheet').wait_for(state='hidden')
    page.locator('[data-action="open-event"][data-id="EV-9822"]').first.click()
    page.locator('.sheet').wait_for(state='visible')
    assert page.locator('.sheet [data-testid="rider-block"]').count() == 0, "a gig with no rider on file shows the rider block"
    assert not errors, f"console errors: {errors}"


def test_home_search_finds_names_dates_and_halls(live_server, page):
    # Owner 2026-11-09: "we need a search bar to search names, dates, halls" on the home page.
    errors = collect_console_errors(page)
    seed_events(page, [fake_gig("EV-9831", "benny", "2099-11-11", clientName="Goldberg Wedding", venue="The Rockleigh", city="Rockleigh"),
                       fake_gig("EV-9832", "eli", "2099-03-04", clientName="Katz Bar Mitzvah", venue="Lake Terrace", city="Lakewood")])
    page.goto(live_server)
    login_as(page, "admin_bookings")
    box = page.locator('[data-home-search]')
    box.wait_for(state='visible')
    for q, want, not_want in [("goldberg", "Goldberg Wedding", "Katz"), ("lake terrace", "Katz Bar Mitzvah", "Goldberg"),
                              ("nov 11 2099", "Goldberg Wedding", "Katz"), ("3/4/2099", "Katz Bar Mitzvah", "Goldberg"), ("eli marcus", "Katz", "Goldberg")]:
        box = page.locator('[data-home-search]')
        box.fill(q)
        res = page.locator('[data-testid="home-search"]').inner_text()
        assert want in res and not_want not in res, (q, res)
    assert page.evaluate("document.activeElement && document.activeElement.hasAttribute('data-home-search')"), "typing loses the search box"
    page.locator('[data-testid="home-search"] [data-action="open-event"]').first.click()
    page.locator('.sheet').wait_for(state='visible')
    assert not errors, f"console errors: {errors}"


def test_adding_a_lead_makes_the_contract_and_asks_send_contract(live_server, page):
    # Owner 2026-11-09: "auto create the contract when i enter the info, ask me open questions and when we add the
    # hold, it should ask me 'send contract' and thats it".
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.locator('[data-action="open-new-lead"]').click()
    page.locator('select[data-action="pick-artist"]').select_option("benny")
    page.locator('input[data-field="clientName"]').fill("Auto Contract Client")
    page.locator('input[data-field="date"]').fill("2027-10-10")
    page.locator('input[data-field="price"]').fill("12000")
    page.locator('[data-action="submit-lead"]').click()
    q = page.locator('[data-testid="contract-questions"]')
    q.wait_for(state="visible")
    assert "Standard Artist Agreement" in q.inner_text()
    assert "needed" in q.locator('label[for="cq-clientEmail"]').inner_text()
    page.locator('[data-testid="cq-send"]').click()   # no email yet: it asks, doesn't send
    assert q.is_visible()
    page.locator('#cq-clientEmail').fill("client@example.com")
    page.locator('#cq-hours').fill("5 hours")
    page.locator('[data-testid="cq-send"]').click()
    # The preview with Send to client -- nothing goes out until that's pressed.
    page.locator('#contractBuilderPrintHost [data-action="open-send-contract"]').wait_for(state="visible")
    assert "Auto Contract Client" in page.locator('#contractBuilderPrintHost').inner_text()
    page.locator('#contractBuilderPrintHost [data-action="close-contract-builder-doc"]').click()
    # The lead now offers Send contract (no Create Contract step).
    assert page.locator('.sheet [data-testid="send-contract"]').count() == 1
    assert page.locator('.sheet [data-action="create-contract"]').count() == 0
    assert not errors, f"console errors: {errors}"


def test_new_lead_never_reuses_a_contracts_gig_id(live_server, page):
    # Owner 2026-11-10 ("mistake, names dont match"): a deleted gig's contract kept pointing at EV-5243 and a new
    # lead was handed that same id, so the old contract showed on it. New ids skip any id a contract points at.
    import json
    orphan = {"id": "CT-9901", "schemaVersion": 3, "leadId": "EV-9950", "template": "standard", "status": "signed",
              "performerArtistId": "benny", "createdAt": "2026-11-06T16:08:35.193Z", "updatedAt": "2026-11-06T16:08:35.193Z",
              "snapshot": {"clientName": "Old Deleted Gig", "eventDate": "2027-02-15"}, "fee": {"amount": 1000}, "versions": []}
    seed_events(page, [fake_gig("EV-9949", "benny", "2099-01-01")])
    page.goto(live_server)
    page.evaluate("(c) => localStorage.setItem('asp_mock_contracts_v1', JSON.stringify([c]))", orphan)
    page.reload()
    login_as(page, "admin_bookings")
    create_lead(page, "Fresh Lead Client", "2099-03-03", artist_id="baruch")
    new_id = page.evaluate("() => S.events.find(e => e.clientName === 'Fresh Lead Client').id")
    assert new_id != "EV-9950", "the new lead reused the id an old contract points at"
    mine = page.evaluate("(id) => JSON.parse(localStorage.getItem('asp_mock_contracts_v1')).filter(c => c.leadId === id).map(c => c.performerArtistId)", new_id)
    assert mine == ["baruch"], f"the new lead's contract is not Baruch's own: {mine}"
