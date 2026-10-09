"""
Real passkey round trip: add a passkey in Settings, sign out, sign back in with ONLY the passkey,
then remove it. Uses Chromium's virtual authenticator (a real WebAuthn device as far as the page
and Supabase are concerned -- the same API a phone's Face ID / a Mac's Touch ID sits behind).

Passkeys are bound to the site's domain (Supabase Auth's webauthn_rp_id = app.aspmgmt.com), so
this can't run on http://localhost like the other specs: the page is served from the real origin
https://app.aspmgmt.com, with requests for that origin answered from the local frontend/ files
(page.route) -- i.e. it tests the code in this checkout, against the real Supabase project.

Found while setting this up (2026-10-09): rp_id still pointed at the old moshe-gif.github.io host,
so every passkey on app.aspmgmt.com failed; and passkey.delete() was passed {id} instead of
{passkeyId}, so "Remove" in Settings never worked.
"""
import mimetypes
import pathlib

from helpers import login_as_real, dismiss_opener

ORIGIN = "https://app.aspmgmt.com"
FRONTEND_DIR = pathlib.Path(__file__).parent.parent / "frontend"


def _serve_local_frontend(route):
    path = route.request.url[len(ORIGIN):].split("#")[0].split("?")[0].lstrip("/") or "index.html"
    f = FRONTEND_DIR / path
    if not f.is_file():
        return route.fulfill(status=404, body="")
    route.fulfill(status=200, body=f.read_bytes(),
                  content_type=mimetypes.guess_type(str(f))[0] or "application/octet-stream")


def _passkey_count(page):
    page.wait_for_function("window.supabaseClient !== undefined", timeout=10000)
    return page.evaluate("async()=>{ const r = await window.supabaseClient.auth.passkey.list(); return (r.data||[]).length; }")


def test_passkey_add_sign_in_remove(page):
    page.context.route(ORIGIN + "/**", _serve_local_frontend)
    cdp = page.context.new_cdp_session(page)
    cdp.send("WebAuthn.enable")
    cdp.send("WebAuthn.addVirtualAuthenticator", {"options": {
        "protocol": "ctap2", "transport": "internal", "hasResidentKey": True,
        "hasUserVerification": True, "isUserVerified": True, "automaticPresenceSimulation": True,
    }})

    page.goto(ORIGIN + "/")
    login_as_real(page)
    page.goto(ORIGIN + "/#/settings")
    page.wait_for_selector('[data-action="add-real-passkey"]', timeout=20000)
    before = _passkey_count(page)

    page.locator('[data-action="add-real-passkey"]').click()
    page.wait_for_function(f"document.querySelectorAll('[data-action=\"remove-real-passkey\"]').length > {before}", timeout=20000)

    try:
        page.evaluate("async()=>{ await window.supabaseClient.auth.signOut(); }")
        page.goto(ORIGIN + "/")
        dismiss_opener(page)
        page.locator('[data-action="real-signin-passkey"]').click()
        page.wait_for_selector("h1", timeout=20000)
        assert page.locator("h1").first.inner_text().strip(), "passkey sign-in didn't land on a real page"
    finally:
        # Remove what this test added, through the real Settings "Remove" button.
        page.goto(ORIGIN + "/#/settings")
        if not page.locator('[data-action="remove-real-passkey"]').count():
            login_as_real(page)
            page.goto(ORIGIN + "/#/settings")
        page.wait_for_selector('[data-action="remove-real-passkey"]', timeout=20000)
        page.locator('[data-action="remove-real-passkey"]').last.click()
        page.wait_for_function(f"document.querySelectorAll('[data-action=\"remove-real-passkey\"]').length === {before}", timeout=20000)
    assert _passkey_count(page) == before, "Remove in Settings didn't delete the passkey"
