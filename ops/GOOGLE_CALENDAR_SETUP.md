# Setup: Google Calendar HOLD/CONFIRMED sync

Lets "Send Contract" also create a HOLD event on ASP's main calendar and every selected artist's
calendar. The connection, the create-hold call, and the calendar-ID mapping UI all exist now --
this doc covers all of it. The one piece still missing is automatically moving a HOLD to CONFIRMED
when the deposit actually arrives (see Notes at the end) -- today every hold this creates stays a
HOLD until that's built.

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

## Part 2 — Deploy the three Edge Functions (~10 min)

In the Supabase dashboard for the **asp-bookings** project, under **Edge Functions**, create each
of these (paste the file's contents from this repo, then Deploy):

- `gcal-oauth-callback` — from `supabase/functions/gcal-oauth-callback/index.ts`.
  **Important**: on this function's page, turn OFF "Enforce JWT Verification" — Google's redirect
  to this endpoint carries no Supabase login token, so the default JWT check would block it.
- `gcal-status` — from `supabase/functions/gcal-status/index.ts` (leave JWT verification ON).
- `gcal-create-hold` — from `supabase/functions/gcal-create-hold/index.ts` (leave JWT verification
  ON — admin-gated, called from Send Contract). **UNVERIFIED** — written against the Calendar API
  v3 docs, never exercised against a real account; expect to debug it against your real calendars.

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

## Part 6 — Map each calendar (~5 min)

Still in Settings → Google Calendar Sync, the **Calendar ID Mapping** section (Load Mapping if it
hasn't loaded) lists ASP Main plus every artist. For each one, paste that calendar's ID — for a
Google Calendar, this is usually its owner's email address (the primary calendar) or, for a
secondary calendar, **Settings → [that calendar] → Integrate calendar → Calendar ID**. Click out of
the field to save (a real live write to `integration_connections`).

Only targets with BOTH a mapping here AND the connection from Part 5 get an actual event created
when Send Contract runs — anything else is reported as skipped, not silently ignored.

## Notes — what's still needed after this

Everything above gets real HOLD events created/updated on the right calendars. Still missing:

- **Auto-moving HOLD → CONFIRMED** when the deposit is actually received — `gcal-create-hold`
  accepts a `status: 'confirmed'` parameter already (it just changes the title prefix and the
  `calendar_links.calendar_status` value), but nothing calls it with that status yet. The natural
  hook is wherever a payment gets marked received (the QuickBooks webhook, `qbo-webhook`, or a
  manual "mark paid" action) — call `gcal-create-hold` again with `status:'confirmed'` for the same
  `eventId`, which will PATCH the existing HOLD event in place (idempotent, same `calendar_links`
  row) rather than creating a duplicate.
- **Per-artist calendar visibility rules** (which fields show on an artist's own view vs. ASP's) —
  not addressed; the spec doesn't detail this further either.
