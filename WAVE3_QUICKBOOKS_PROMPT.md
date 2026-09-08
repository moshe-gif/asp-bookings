Working directory: /Users/sonnenscheinfam/asp-bookings

Moshe wants a real two-way QuickBooks Online sync (confirmed, not one-way, not just a reference
link): push an invoice to QBO when a lead is booked, and pull payment status back so "balance
received" updates itself instead of being marked manually. This is Wave 3 of the backend plan —
read `CLAUDE.md` (especially the Security section — this is exactly the "financial-control API,
treat the secret as a crown jewel" case) and `INTEGRATIONS.md`'s meta-rules before starting.
**Flag this for double-review before merge per `CLAUDE.md` priority #4** — real external
money-adjacent system, real client invoices.

## What already exists to build on
- `backend/proxy.js` — was inert template code; a prior wave made `verifyIdToken()` real (verifies
  Supabase session JWTs against the project's JWKS) and it already has a working AES-256-GCM
  encrypted-state-file pattern (`getStateKey`/`loadST`/`saveST`) — reuse that verbatim for storing
  the QuickBooks OAuth refresh token, don't invent a new storage mechanism.
- Real, shared data now lives in Supabase (`events`/`custom_invoices` tables,
  `supabase/migrations/0001_initial_schema.sql`) — Wave 1 (or a following wave) should have moved
  event/invoice writes off localStorage onto Supabase with RLS; confirm that's actually live before
  building on top of it, since this integration needs a real "booked" event to react to.

## What to build
1. Intuit OAuth2 app registration (sandbox first, then production) — client id/secret in `.env`
   (never committed), refresh token stored via `proxy.js`'s existing encrypted state file.
2. New `proxy.js` route(s): OAuth callback/token exchange; a route the browser calls after a lead
   is marked booked, which creates the matching QBO invoice server-side (never exposes the QBO
   token to the browser).
3. Pull path: a webhook receiver (QuickBooks supports webhooks) or, if that's not practical yet, a
   scheduled poll — either way, on a payment/paid-status change, update the event's
   `balance_received`/`balance_received_date` in Supabase. Every unattended path needs a failure
   channel per `INTEGRATIONS.md`'s meta-rules (don't fail silently).
4. Decide and document: which ASP entity (a specific QBO "Customer") each invoice posts under,
   and how a partial payment / voided QBO invoice should reflect back into the app — these are
   real edge cases, not implementation detail, and Moshe should sign off on the behavior before
   it's built, not just the plumbing.

Verify against the QuickBooks Sandbox before touching production books. Run the test harness
before commit+push, per `CLAUDE.md`'s standing rule.
