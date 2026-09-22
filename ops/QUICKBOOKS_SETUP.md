# Setup: QuickBooks invoicing (Send Contract → real deposit invoice)

Lets "Send Contract" also create and email a real QuickBooks invoice for the deposit, payable by
credit card through QuickBooks' own hosted "Pay Now" link — no card numbers ever touch this app,
that stays entirely on Intuit's side. Four things need to happen, roughly in order.

## Part 1 — Register an Intuit Developer app (~10 min)

This connects to ASP's *own* existing QuickBooks Online company — it does not need to be reviewed/
published to the QuickBooks App Store (that's only required for apps meant to be installed by
*other* companies).

1. Go to **developer.intuit.com** → sign in with the same account/credentials ASP's QuickBooks
   Online is under (or an account with admin access to that company).
2. **Dashboard → Create an app** → choose **QuickBooks Online and Payments**.
3. Once created, go to the app's **Keys & OAuth** tab.
4. Under **Production**, note the **Client ID** and **Client Secret** — keep these private, treat
   like a password.
5. Under **Redirect URIs**, add exactly:
   ```
   https://psgpxbkncuavlnpplykf.supabase.co/functions/v1/qbo-oauth-callback
   ```
   (must match exactly, including no trailing slash.)
6. Under **Scopes**, only `com.intuit.quickbooks.accounting` is needed — this app never requests
   card-processing scope, since invoices are paid through QuickBooks' own hosted page.

## Part 2 — Deploy the three Edge Functions (~10 min)

In the Supabase dashboard for the **asp-bookings** project, under **Edge Functions**, create each
of these (paste the file's contents from this repo, then Deploy):

- `qbo-oauth-callback` — from `supabase/functions/qbo-oauth-callback/index.ts`.
  **Important**: on this function's page, turn OFF "Enforce JWT Verification" — Intuit's redirect
  to this endpoint carries no Supabase login token, so the default JWT check would block it.
- `qbo-create-invoice` — from `supabase/functions/qbo-create-invoice/index.ts` (leave JWT
  verification ON — this one is admin-gated using the real login, same as `send-contract-email`).
- `qbo-status` — from `supabase/functions/qbo-status/index.ts` (leave JWT verification ON).

Then add these **Function Secrets** (Supabase dashboard → Edge Functions → Secrets — shared across
all functions in the project):
- `QBO_CLIENT_ID` = the Client ID from Part 1
- `QBO_CLIENT_SECRET` = the Client Secret from Part 1
- `QBO_REDIRECT_URI` = `https://psgpxbkncuavlnpplykf.supabase.co/functions/v1/qbo-oauth-callback`
- `QBO_ENVIRONMENT` = `production`
- `APP_URL` = `https://moshe-gif.github.io/asp-bookings` (or `https://app.aspmgmt.com` once the
  domain migration is live — update this secret when that switch happens)

## Part 3 — Run the database migration (~2 min)

In the Supabase dashboard's **SQL Editor**, run the contents of
`supabase/migrations/0009_quickbooks_connection.sql` from this repo. This creates the
`qbo_connection` table that holds the OAuth tokens — it has no policies at all, so it's
unreachable from the browser; only the Edge Functions (using the service-role key) can read or
write it.

## Part 4 — Tell the app the Client ID (~1 min)

In `frontend/workspaces/asp.js`, find:
```js
const QBO_CLIENT_ID = '';
```
and fill in the same Client ID from Part 1 (this one is safe to be public — it's the "which app is
this" identifier, not a secret; the Client *Secret* stays server-side only, in the Edge Function
secrets from Part 2). Commit and push.

## Part 5 — Connect (~1 min, one-time)

As an ASP admin, go to **Settings** in the app → the new **QuickBooks** card → **Connect
QuickBooks** → sign in to the real QuickBooks Online account and authorize. You'll land back on
Settings showing "Connected." From then on, the Send Contract confirm screen offers "Also send a
QuickBooks invoice for the deposit," pre-filled with the deposit amount.

## Notes

- The connection is shared for the whole app (one QuickBooks company, not per-user) — whichever
  admin connects it first is fine, anyone can hit Reconnect later if it needs refreshing.
- QuickBooks refresh tokens are valid ~100 days and rotate on every use; the Edge Functions handle
  refreshing automatically, but if it's ever untouched for 100+ days it will need reconnecting.
- This does not yet track *when* an invoice actually gets paid inside the app (Moshe would still
  see that in QuickBooks itself) — that's a natural next step (QuickBooks webhooks or a status-
  check button) once this base flow is confirmed working.
