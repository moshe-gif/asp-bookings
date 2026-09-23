# Setup: FlightAware flight status tracking

Lets a confirmed flight's status (on-time, delayed, cancelled, gate/terminal) be checked from the
app, on a travel request's "Confirmed Flights" section. Much simpler than the QuickBooks/Google
Calendar integrations — no OAuth, just one API key.

## Part 1 — Get an AeroAPI key (~5 min)

1. Go to **flightaware.com/aeroapi** → sign up / sign in → subscribe to a plan (a low-volume
   "Personal" tier is enough for occasional lookups; check current pricing on their site).
2. Under **My Account → AeroAPI** (or similar), copy the **API key**.

## Part 2 — Deploy the Edge Function (~5 min)

In the Supabase dashboard for the **asp-bookings** project, under **Edge Functions**, create:

- `flightaware-status` — from `supabase/functions/flightaware-status/index.ts` (leave JWT
  verification ON — admin-gated using the real login, same as every other admin-only function).

Add the Function Secret:
- `FLIGHTAWARE_API_KEY` = the key from Part 1

## Part 3 — Use it

No further app-side setup needed — the "Check Status" button on a travel request's Confirmed
Flights section always tries the real lookup; before this is set up it just reports "FlightAware
isn't connected yet" instead of pretending to work.

## Notes — what's still needed for the full spec item 8

This gets on-demand lookups working. The spec also asks for:
- **Automatic** status checks (a webhook, or a scheduled poll that starts near departure and stops
  after arrival/cancel) rather than only on-demand — not built; a natural next step once on-demand
  lookups are confirmed working against a real flight.
- **Branded notification emails** when status changes (delay/cancel/gate change) — would reuse the
  existing `send-contract-email` pattern once the automatic-check piece above exists to trigger it.
- **Auto-extracting flight details from Rivky's email reply** instead of an admin typing them in —
  needs Gmail API access, blocked the same way Phase 6 (Zelle matching) is. Manual entry (already
  built, on the travel request's Confirmed Flights section) covers the "admin approves parsed
  details" step the spec requires either way, just without the auto-extraction half.
