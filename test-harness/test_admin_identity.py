"""
Audit 3.7: a signed-in admin is identified by their own admin_users uuid, not their role slug --
two admins sharing a role (e.g. two bookers) must stay two people in approvals, logs and
assignments. Records saved before the change (role slug as the person) still resolve.
"""
import re

from helpers import login_as

UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")


def test_admin_session_is_keyed_by_uuid(live_server, page):
    page.goto(live_server)
    login_as(page, "admin_bookings")
    user = page.evaluate("window.S.user")
    assert UUID.match(user), f"admin session should be the admin_users uuid, got {user!r}"


def test_ceo_role_still_gets_ceo_view(live_server, page):
    page.goto(live_server)
    login_as(page, "admin_ceo")
    assert UUID.match(page.evaluate("window.S.user"))
    # Role-based rule still applies: the CEO's menu hides Contract Builder.
    assert page.locator('.rail-link[data-view="contract_builder"]').count() == 0
    assert page.locator('.rail-link[data-view="dashboard"]').count() == 1
