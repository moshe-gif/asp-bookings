# Setup: Gmail mailbox connections (Zelle matching)

Lets an incoming Zelle payment notification email be matched automatically to the right balance
due, by reading (read-only) an artist's own Gmail inbox for Zelle notices. This doc covers the
connection piece — each mailbox authorizes separately, since (unlike QuickBooks or Google Calendar
sync, both one shared ASP account) this reads *individual artists'* own inboxes.

## Part 1 — Register a Google Cloud OAuth client (~15 min)

Can reuse the same Google Cloud project as Google Calendar Sync if that's already set up (or
create one — see `ops/GOOGLE_CALENDAR_SETUP.md` Part 1 for the walkthrough), with one addition:

1. **APIs & Services → Library** → enable the **Gmail API** (in addition to Calendar API if shared).
2. **APIs & Services → Credentials** → either reuse the existing OAuth client or create a new Web
   application client.
3. Under **Authorized redirect URIs**, add exactly:
   ```
   https://psgpxbkncuavlnpplykf.supabase.co/functions/v1/gmail-oauth-callback
   ```
4. Note the **Client ID** and **Client Secret**.
5. On the **OAuth consent screen**, the `gmail.readonly` scope will show as a "sensitive scope" —
   for a Workspace-internal app this is fine in Internal mode; for External/Testing mode, each
   artist whose mailbox connects needs to be added as a test user (or the app needs Google's
   verification for production use with arbitrary Gmail accounts).

## Part 2 — Deploy the two Edge Functions (~5 min)

- `gmail-oauth-callback` — from `supabase/functions/gmail-oauth-callback/index.ts`.
  **Important**: turn OFF "Enforce JWT Verification" (Google's redirect carries no Supabase token).
- `gmail-status` — from `supabase/functions/gmail-status/index.ts` (leave JWT verification ON).

Function Secrets:
- `GMAIL_CLIENT_ID` = the Client ID from Part 1
- `GMAIL_CLIENT_SECRET` = the Client Secret from Part 1
- `GMAIL_REDIRECT_URI` = `https://psgpxbkncuavlnpplykf.supabase.co/functions/v1/gmail-oauth-callback`
- `APP_URL` = same value used elsewhere (QuickBooks/Google Calendar)

## Part 3 — Run the database migration (~2 min)

Run `supabase/migrations/0019_gmail_oauth_tokens.sql` in the SQL Editor — creates
`gmail_oauth_tokens` (one row per connected mailbox, no client-facing policies, service-role only).

## Part 4 — Tell the app the Client ID (~1 min)

In `frontend/workspaces/asp.js`, find `const GMAIL_CLIENT_ID = '';` and fill in the Client ID from
Part 1 (safe to be public, same reasoning as QBO_CLIENT_ID/GOOGLE_CALENDAR_CLIENT_ID). Commit and
push.

## Part 5 — Add and connect each mailbox (~2 min per mailbox)

In the app, **Settings → Gmail Mailboxes (Zelle Matching)**:
1. Pick the artist (or leave as "ASP sending mailbox" for a shared/office address) and enter the
   mailbox's email → **Add Mailbox**. This just registers the mailbox — it isn't connected yet.
2. Click **Connect** next to it. Whoever has access to that inbox (the artist themselves, or ASP
   on their behalf if they've shared credentials) signs in to Google and authorizes.
3. It shows **Connected** once done.

## Notes — what's still needed for the rest of item 6

Connecting a mailbox alone doesn't match any payments yet. Settings → **Zelle Review Queue**
already exists (mirrors the QuickBooks Payment Reconciliation Queue exactly -- a real, session-
guarded read of `zelle_notifications` where `status='unmatched'`) but will show nothing until the
two pieces that actually populate that table are built:
- **Gmail push notifications (watch) or periodic polling** — `gmail_mailboxes.watch_expires_at`/
  `last_history_id` (migration 0015) already model this; nothing sets them up yet.
- **The parser + scored matcher** — reading only allowlisted Zelle-notification patterns,
  minimizing stored content (amount/sender/memo/timestamp only, per the spec) into
  `zelle_notifications`, then scoring amount/sender/memo/date/mailbox/type/window and auto-applying
  only above a high-confidence threshold -- everything else stays `unmatched` for the review queue
  above, and an approved match routes through the same centralized payment-received workflow
  QuickBooks uses.

This is genuinely the largest remaining piece of the whole spec — treat it as its own multi-step
project once the connection piece above is confirmed working for at least one real mailbox.
