"""
Owner 2026-11-12: "i need it to be able to login with verified emails also". The app asks for a fresh sign-in each
time it opens. That can be Face ID (a passkey) OR a one-time code emailed to the person's own address.
  - A session that came from an emailed code a moment ago opens the app (no Face ID screen).
  - A session restored from an earlier visit shows the lock screen, which offers "Email me a code"; that sends a
    code to the same address and shows the code box.
The harness's own accounts skip the lock screen, so this uses a made-up session for a made-up address, and every
Supabase sign-in call is answered here (nothing reaches Supabase Auth, no email is sent).
"""
import base64
import json
import time

from helpers import dismiss_opener, collect_console_errors

STORAGE_KEY = "sb-psgpxbkncuavlnpplykf-auth-token"
EMAIL = "lock-screen-check@example.com"


def _b64(d):
    return base64.urlsafe_b64encode(json.dumps(d).encode()).decode().rstrip("=")


def _session(signed_in_at, method="otp"):
    now = int(time.time())
    claims = {"sub": "00000000-0000-4000-8000-000000000001", "email": EMAIL, "role": "authenticated",
              "aud": "authenticated", "exp": now + 3600, "iat": now, "session_id": "s1",
              "amr": [{"method": method, "timestamp": signed_in_at}]}
    token = f"{_b64({'alg': 'HS256', 'typ': 'JWT'})}.{_b64(claims)}.sig"
    return {"access_token": token, "refresh_token": "r1", "token_type": "bearer", "expires_in": 3600,
            "expires_at": now + 3600,
            "user": {"id": claims["sub"], "email": EMAIL, "aud": "authenticated", "role": "authenticated",
                     "app_metadata": {}, "user_metadata": {}, "created_at": "2026-01-01T00:00:00Z"}}


def _stub_supabase(page, calls):
    # Sign-in calls: answered here. Data calls: an empty answer (the made-up user has no account).
    def auth(route, request):
        calls.append(request.url.split("/auth/v1/")[1].split("?")[0])
        route.fulfill(status=200, content_type="application/json", body="{}")
    page.route("**/auth/v1/**", auth)
    page.route("**/rest/v1/**", lambda r: r.fulfill(status=200, content_type="application/json", body="[]"))


def _open_with_session(page, live_server, session):
    page.add_init_script(f"localStorage.setItem({json.dumps(STORAGE_KEY)}, {json.dumps(json.dumps(session))})")
    page.goto(live_server)
    dismiss_opener(page)


def test_fresh_email_code_session_opens_without_face_id(live_server, page):
    calls = []
    _stub_supabase(page, calls)
    _open_with_session(page, live_server, _session(int(time.time()) - 5))
    page.wait_for_timeout(2500)
    assert page.locator('[data-testid="faceid-gate"]').count() == 0, "an emailed-code sign-in was sent to the Face ID screen"


def test_lock_screen_offers_email_code(live_server, page):
    errors = collect_console_errors(page)
    calls = []
    _stub_supabase(page, calls)
    _open_with_session(page, live_server, _session(int(time.time()) - 3 * 3600))   # signed in hours ago
    gate = page.locator('[data-testid="faceid-gate"]')
    gate.wait_for(state="visible", timeout=15000)
    btn = page.locator('[data-testid="faceid-email-code"]')
    btn.wait_for(state="visible", timeout=10000)
    btn.click()
    page.get_by_text(EMAIL).first.wait_for(state="visible", timeout=10000)
    assert any(c.startswith("otp") for c in calls), f"no code was requested: {calls}"
    assert page.locator('[data-testid="faceid-gate"]').count() == 0
    real = [e for e in errors if "401" not in e and "Failed to load resource" not in e]
    assert not real, f"console errors: {real}"
