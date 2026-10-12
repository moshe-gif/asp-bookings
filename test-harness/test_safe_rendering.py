"""
2026-10-09 audit 1.9 -- record text and addresses go into the page safely:
  - a project link must be a web address: "javascript:" is refused, a bare domain becomes https://
    (and adding a link works at all -- its inputs were bound to the wrong field names until 2026-10-12);
  - a project cover image that isn't a real image data: URL never reaches the page's CSS;
  - quick typing then closing the Contract Builder never throws ("node to be removed is no longer
    a child"): a render requested while one is running now waits for it.
Fictional data in the test browser only (shared sync is off).
"""
from helpers import login_as, collect_console_errors, create_project, create_lead
from test_contract_builder import create_contract_from_lead


def _add_link(page, url):
    page.locator('[data-form="projectlink"] input[data-field="url"]').fill(url)
    page.locator('[data-action="add-project-link"]').first.click()
    page.wait_for_timeout(200)


def test_project_links_are_web_addresses_only(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    create_project(page, "Safe Link Project")
    page.locator('[data-action="set-project-tab"][data-tab="media"]').first.click()
    _add_link(page, "javascript:alert(document.cookie)")
    assert page.locator('a[href^="javascript:"]').count() == 0, "a javascript: link was added"
    _add_link(page, "example.com/rider")
    assert page.locator('a[href="https://example.com/rider"]').count() == 1, "a bare domain wasn't turned into an https link"
    assert not errors, f"console errors: {errors}"


def test_bad_cover_image_never_reaches_css(live_server, page):
    page.add_init_script("""localStorage.setItem('asp_mock_projects_v1', JSON.stringify([{id:'PR-9901', title:'Cover Test',
        artistId:null, status:'active', coverImage:"x');background:url('https://evil.example/t.png", tasks:[], links:[], images:[],
        log:[], createdAt:'2099-01-01', dueDate:null}]));""")
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.evaluate("location.hash = '#/projects'"); page.wait_for_timeout(500)
    assert "evil.example" not in page.content(), "an unsafe cover image address reached the page"


def test_fast_edit_then_close_has_no_page_error(live_server, page):
    page_errors = []
    page.on("pageerror", lambda e: page_errors.append(str(e)))
    page.goto(live_server)
    login_as(page, "admin_bookings")
    create_lead(page, "Render Race Client", "2099-08-08", artist_id="eli")
    builder = create_contract_from_lead(page, "standard")
    for path, value in (("top.hoursOfEngagement", "4 hours"), ("fee.amount", "8000"), ("notes", "Quick note")):
        el = builder.locator(f'[data-contract-field="{path}"]').first
        el.fill(value); el.dispatch_event("change")
    page.locator('#contractBuilderOverlayHost [data-action="set-contract-status"][data-status="sent"]').first.click()
    page.locator('#contractBuilderOverlayHost [data-action="close-contract-builder"]').first.click()
    page.wait_for_timeout(300)
    assert not page_errors, f"page errors: {page_errors}"
