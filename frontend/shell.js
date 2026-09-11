// Shell: owns auth/session, the workspace switcher, routing/mount, and the cross-company
// views (unified digest, unified who-owes-what, Settings). Phase 1a placeholder only -- the
// ASP workspace (workspaces/asp.js) still self-mounts on load exactly as it did as a single
// file, so there's nothing for this file to actively do yet. Phase 1b adds: company_members
// resolution, the workspace switcher control, and real mount()/unmount() calls into each
// workspace when the user switches.
window.Workspaces = window.Workspaces || {};
