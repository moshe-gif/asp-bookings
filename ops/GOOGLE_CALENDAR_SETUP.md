# Setup: Google Calendar HOLD/CONFIRMED sync

Lets "Send Contract" also create a HOLD event on ASP's main calendar and every selected artist's
calendar, automatically moving to CONFIRMED once the deposit is received. This doc covers the
OAuth connection piece only -- the create-hold Edge Function and per-artist calendar ID mapping
are a follow-up on top of this (see Notes at the end).

## Part 1 — Register a Google Cloud OAuth client (~15 min)

1. Go to **console.cloud.google.com** → create a new project (or use an existing one) for ASP.
2. **APIs & Services → Library** → enable the **Google Calendar API**.
3. **APIs & Services → OAuth consent screen** → set up as **Internal** if ASP uses Google
   Workspace, otherwise **External** (in that case it'll need to stay in "Testing" mode with ASP's
   own Google account added as a test user, or go through verification for a real production
   badge -- Testing mode is fine to start).
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → type **Web
   application**.
5. Under **Authorized redirect URIs**, add exactly:
   ```
   https://psgpxbkncuavlnpplykf.supabase.co/functions/v1/gcal-oauth-callback
   ```
6. Note the **Client ID** and **Client Secret** — keep the secret private, treat like a password.

## Part 2 — Deploy the two Edge Functions (~5 min)

In the Supabase dashboard for the **asp-bookings** project, under **Edge Functions**, create each
of these (paste the file's contents from this repo, then Deploy):

- `gcal-oauth-callback` — from `supabase/functions/gcal-oauth-callback/index.ts`.
  **Important**: on this function's page, turn OFF "Enforce JWT Verification" — Google's redirect
  to this endpoint carries no Supabase login token, so the default JWT check would block it.
- `gcal-status` — from `supabase/functions/gcal-status/index.ts` (leave JWT verification ON).

Then add these **Function Secrets** (Supabase dashboard → Edge Functions → Secrets):
- `GOOGLE_CALENDAR_CLIENT_ID` = the Client ID from Part 1
- `GOOGLE_CALENDAR_CLIENT_SECRET` = the Client Secret from Part 1
- `GOOGLE_CALENDAR_REDIRECT_URI` = `https://psgpxbkncuavlnpplykf.supabase.co/functions/v1/gcal-oauth-callback`
- `APP_URL` = wherever the app is currently hosted (same value used for QuickBooks' `APP_URL`, if
  that's already set)

## Part 3 — Run the database migration (~2 min)

In the Supabase dashboard's **SQL Editor**, run the contents of
`supabase/migrations/0017_gcal_connection.sql` from this repo. This creates the `gcal_connection`
table that holds the OAuth tokens — it has no policies at all, so it's unreachable from the
browser; only the Edge Functions (using the service-role key) can read or write it.

## Part 4 — Tell the app the Client ID (~1 min)

In `frontend/workspaces/asp.js`, find:
```js
const GOOGLE_CALENDAR_CLIENT_ID = '';
```
and fill in the same Client ID from Part 1 (safe to be public — the Client *Secret* stays
server-side only, in the Edge Function secrets from Part 2). Commit and push.

## Part 5 — Connect (~1 min, one-time)

As an ASP admin, go to **Settings** in the app → the new **Google Calendar Sync** card → **Connect
Google Calendar** → sign in to the Google account that should own these calendar writes and
authorize. You'll land back on Settings showing "Connected."

Make sure that account has **write access** to every artist's calendar and to ASP's main calendar
(share each one with it, same as you would with a human assistant), since it's the one account
that writes HOLD/CONFIRMED events everywhere.

## Notes — what's still needed after this

This setup gets the OAuth connection working and visible in Settings, but "Send Contract" will
still report calendar holds as skipped until two more pieces land:

- **`gcal-create-hold` Edge Function** — the actual Calendar API call that creates/updates a HOLD
  event by exact calendar ID + event ID (never by title search), storing the result in the
  `calendar_links` table (already exists, migration 0013) so later updates target the right event.
- **Per-artist calendar ID mapping** — a Settings screen for entering ASP main's calendar ID plus
  each artist's calendar ID (the `integration_connections` table, migration 0013, is designed to
  hold these as `type='google_calendar'` rows).

Both are naturally scoped as their own follow-up once this connection piece is confirmed working.
