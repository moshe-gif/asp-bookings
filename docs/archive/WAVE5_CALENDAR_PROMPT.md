Working directory: /Users/sonnenscheinfam/asp-bookings

Moshe wants every artist plus Ilan to connect their own Google Calendar, two-way (confirmed): ASP
gigs get pushed onto their calendar, and their real calendar is read for conflict detection
against ASP's own scheduling — not just other ASP bookings. This is Wave 5 of the backend plan —
read `CLAUDE.md` and `INTEGRATIONS.md` before starting.

## What already exists to build on
- `user_settings` table (`supabase/migrations/0001_initial_schema.sql`) already has
  `calendar_connected boolean` / `calendar_email text` columns — placeholder fields with a mocked
  "Connect"/"Disconnect" button already in `renderSettingsPage()` (search for `connect-calendar`
  in `frontend/index.html`). This wave makes that real rather than adding a new UI surface.
- `findConflicts()`/`allConflictPairs()` (`frontend/index.html` ~line 1252) is the app's single
  source of truth for conflict detection today, reused by the calendar, event creation, dashboard,
  and Ask AI — extend THIS function to also check a connected person's real calendar busy/free
  data, rather than adding a second, parallel conflict-check path (AUDIT.md flagged near-duplicate
  logic like this before; don't repeat it here).
- `backend/proxy.js`'s encrypted-state-file pattern (AES-256-GCM) is the right place for each
  person's Google OAuth refresh token — keyed per `user_id`, never sent to the browser.

## What to build
1. Google OAuth (Calendar scope, incremental auth) initiated from each person's own Settings page
   — one consent per person, not a shared app-wide credential.
2. `proxy.js` routes: OAuth callback/token exchange/refresh; a route to create/update a calendar
   event when an ASP gig is confirmed (push); a route to read busy/free + real event details for
   conflict-checking (pull) — every request bears the caller's verified session token, and the
   proxy maps that to their own stored Google token, never someone else's.
3. Extend `findConflicts()` to include a real-calendar check for whichever person is being
   scheduled, when they're connected.
4. Graceful disconnect/revoke — clearing `user_settings.calendar_connected` should also stop
   pushing/pulling for that person immediately, and handle an expired/revoked Google token without
   crashing (surface it as "reconnect needed", not a silent failure).

Run the test harness before commit+push. Real Google OAuth isn't something the harness can drive
end-to-end (same class of gap as the real Supabase auth path) — note that honestly in
`test-harness/README.md` rather than faking a pass.
