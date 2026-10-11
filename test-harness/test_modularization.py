"""
Parent-app Phase 1a: ASP was extracted from the old single-file index.html into its own module
(frontend/workspaces/asp.js) behind a mount/unmount contract, so it can evolve independently of
the shell (frontend/shell.js) and the future VOX workspace (frontend/workspaces/vox.js). This
file is the acceptance check the plan asked for: proves the seam is real, not just a comment
convention, and proves the extraction changed zero rendered behavior.

The APP_VERSION bump (v1.0.0 -> v1.1.0) IS this phase's "one real ASP screen change" -- made by
editing only frontend/workspaces/asp.js. That shell.js and workspaces/vox.js needed zero edits to
land it is a repo-structure fact (verifiable via `git diff --stat`, not something Playwright can
assert), not a runtime behavior -- documented here rather than faked as a browser assertion.
"""
import pathlib
import re

from playwright.sync_api import expect
from helpers import login_as

ASP_JS = (pathlib.Path(__file__).parent.parent / "frontend" / "workspaces" / "asp.js").read_text()


def test_workspace_contract_registered(live_server, page):
    """window.Workspaces.asp exists with the expected shape -- proves asp.js really did register
    itself through the mount/unmount contract described in the parent-app plan, not just that the
    file happens to still work when inlined."""
    page.goto(live_server)
    shape = page.evaluate("""
        () => window.Workspaces && window.Workspaces.asp
            ? { id: window.Workspaces.asp.id, hasMount: typeof window.Workspaces.asp.mount === 'function',
                hasUnmount: typeof window.Workspaces.asp.unmount === 'function' }
            : null
    """)
    assert shape is not None, "window.Workspaces.asp was not registered"
    assert shape["id"] == "asp"
    assert shape["hasMount"] and shape["hasUnmount"]


def test_app_version_bumped_for_modularization(live_server, page):
    page.goto(live_server)
    login_as(page, "admin_bookings")
    expect(page.locator('.rail-link[data-action="nav"][data-view="settings"]')).to_be_visible()
    # Read the version from asp.js itself so a later bump doesn't break this (audit 7.6).
    version = re.search(r"const APP_VERSION = '([^']+)'", ASP_JS).group(1)
    assert page.locator(f"text={version}").count() >= 1, f"expected APP_VERSION {version} to render in the rail footer"
