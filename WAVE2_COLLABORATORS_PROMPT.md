Working directory: /Users/sonnenscheinfam/asp-bookings

Moshe wants people outside ASP/Ilan's org to collaborate on specific Projects — real invited
accounts, scoped by RLS to only the project(s) they're invited to (confirmed: not a share-link,
not full app access). This is Wave 2 of the backend plan in git history (see the "Real backend"
plan/commits around Wave 1 — real Supabase auth + role-aware admin login + a self-serve Users
Dashboard already shipped; read `supabase/migrations/0001-0003*.sql` and
`frontend/index.html`'s `/* ============ REAL AUTH (Supabase) ============ */` and
`/* ============ USERS DASHBOARD */` sections before starting).

## What already exists to build on
- `project_people` table (`supabase/migrations/0001_initial_schema.sql`) — currently just
  `{id, project_id, role, name}`, no `user_id`/`email` linkage yet.
- `link_new_user_to_roster()` trigger (`0002_auth_linking.sql`) — links a new `auth.users` row to
  `artists`/`admin_users` by email match on first real sign-in. The pattern to extend.
- The Users Dashboard (`renderUsersDashboardCard()`/`doAddRealUser()` in `frontend/index.html`) —
  admin adds a real person by name+email, which inserts a row they later sign into. Same shape
  applies to inviting a collaborator onto one project.

## What to build
1. Migration: add `user_id uuid references auth.users(id)` and `email text` to `project_people`;
   extend (or add a second) trigger so a new `auth.users` row also links any `project_people` row
   matching by email, same null-safe pattern as the existing trigger (never overwrite an existing
   link).
2. New RLS policy on `projects`/its child tables (`project_tasks`, `project_comments`,
   `project_people`, `project_images`, `project_links`): a signed-in user can see/act on a project
   if `is_admin()` OR `artist_id = current_artist_id()` OR they have a linked `project_people` row
   for that specific project — nothing else. Write this as a `current_project_ids()` helper
   function (mirrors `current_artist_id()`) to keep every child-table policy DRY.
3. UI: an "Invite Collaborator" action on a Project (email input) → inserts the `project_people`
   row before they've signed up. A collaborator's nav is a stripped shell — just that one
   project's board, no Financials/Leads/other projects/Users Dashboard.
4. Test harness: extend with a spec proving a collaborator's real session genuinely cannot read
   any other project or top-level data (not just that the UI hides it) — mirrors whatever RLS
   spec pattern Wave 1 added for artist-vs-artist isolation, see `test-harness/README.md`.

Constraints: read `CLAUDE.md` (Engineering Priorities + Security) first. Run the test harness
before commit+push, per the standing rule there.
