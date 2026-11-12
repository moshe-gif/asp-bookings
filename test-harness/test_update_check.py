"""
Audit #14 (2026-11-12): an app left open for days kept running the old release after a deploy. When the app
comes back on screen it asks the server (HEAD workspaces/asp.js) whether the script changed since the page
loaded; if it did, a bar offers Reload. Here the server's answer is changed between two checks.
"""
from helpers import login_as, collect_console_errors


def test_new_release_shows_reload_bar(live_server, page):
    errors = collect_console_errors(page)
    tag = {"v": '"release-1"'}

    def answer(route, request):
        if request.method == "HEAD":
            route.fulfill(status=200, headers={"etag": tag["v"], "content-type": "application/javascript"}, body="")
        else:
            route.continue_()

    page.route("**/workspaces/asp.js*", answer)
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.wait_for_function("() => window.S && S.user")
    page.evaluate("() => document.dispatchEvent(new Event('visibilitychange'))")
    page.wait_for_timeout(500)
    assert page.locator('[data-testid="update-bar"]').count() == 0, "no new release yet, so no bar"

    tag["v"] = '"release-2"'   # a deploy happened
    page.evaluate("() => document.dispatchEvent(new Event('visibilitychange'))")
    bar = page.locator('[data-testid="update-bar"]')
    bar.wait_for(state="visible", timeout=5000)
    assert bar.locator('[data-action="reload-app"]').is_visible()
    assert not errors, f"console errors: {errors}"
