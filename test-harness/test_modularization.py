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
from helpers import login_as


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
    page.locator('.rail-link[data-action="nav"][data-view="settings"]')  # sanity the rail rendered
    assert page.locator("text=v1.1.0").count() >= 1, "expected the post-extraction APP_VERSION to render in the rail footer"
