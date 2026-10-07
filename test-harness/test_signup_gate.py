"""
Navigation/data-layer refactor, PR 17: closes a real open-signup hole. doSendSignInCode() (then doSubmitMagicLink()) used
to call signInWithOtp() without shouldCreateUser:false -- Supabase would happily mint a brand-new
auth.users row for any email a stranger typed in, even though app access is separately gated on a
pre-seeded admin_users/artists roster row (so the account was ultimately useless, but still a real
credential-store entry created on demand by anyone). Now fails fast with a clear message instead.

Uses a real (unconfigured) Supabase call -- not Demo Mode -- so this needs the live_server +
real Supabase project, same as test_real_auth.py, but doesn't need the dedicated test-harness
account since it's deliberately testing an email that should NOT exist anywhere.
"""
from helpers import dismiss_opener


def test_unknown_email_is_rejected_without_creating_an_account(live_server, page):
    page.goto(live_server)
    dismiss_opener(page)
    page.get_by_text("Sign in with email").click()
    page.locator('input[type="email"]').fill("definitely-not-on-roster-pytest@example.com")
    page.get_by_text("Send Sign-In Code").click()

    # The real Supabase call needs a moment -- wait for the toast rather than checking instantly.
    page.wait_for_selector("text=isn't set up yet", timeout=10000)
    # The success state ("Check your email...") must NOT appear for an unknown email.
    assert page.get_by_text("Check your email").count() == 0, (
        "unknown email appears to have been sent a sign-in link (open-signup hole still present)"
    )
