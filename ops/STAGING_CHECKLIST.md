# Staging / sandbox test checklist — ops automation project

A pre-launch checklist for confirming each integration works for real before relying on it for a
real booking. Written against the state of the app as of the "go until all phases are done" push
(2026-09-22/23) — see `~/.claude/projects/.../memory/asp_bookings_project.md` for the full history
if picking this up later, or just re-read this repo's commit log from `2dd3fb6` onward.

## 0. Before anything else

- [ ] Confirm migrations `0010`–`0019` are all applied to the live Supabase project (Dashboard →
  SQL Editor → run each `supabase/migrations/00XX_*.sql` file in numeric order if not already
  done — copy from the actual file, not a chat-pasted block, to avoid paste corruption).
- [ ] Confirm Settings → Data Migration → Preview shows real counts, and migrating payee profiles/
  contracts actually succeeds (not "table not found").
- [ ] Full pytest suite green: `cd test-harness && source .venv/bin/activate && pytest`.

## 1. Send Contract + Invoice bundle (Phase 2/3)

- [ ] Create a lead (single artist), create a Standard contract from it, Send Contract with "Also
  send a QuickBooks invoice" — confirm the email actually arrives and, if QuickBooks is connected,
  the invoice amount matches the deposit shown in the confirm screen (this was the original bug
  this whole project started from — re-verify it stays fixed).
- [ ] Create a multi-artist lead (New Lead → Additional ASP Artists), confirm the roster shows
  correct fees, create a contract and confirm it defaults to Multi-Line Package with one line item
  per artist.
- [ ] Retry sending the same contract a second time — confirm it does NOT create a second
  QuickBooks invoice (idempotency via `c.qboInvoiceId`).

## 2. QuickBooks (Phase 3/5)

- [ ] Settings → QuickBooks → Connect, confirm it shows "Connected" with the real company ID.
- [ ] Send a real test invoice via Send Contract, confirm it appears in QuickBooks Online.
- [ ] Once `qbo-webhook` is deployed (see `ops/QUICKBOOKS_SETUP.md` Part 6): pay that test invoice
  for real (or in a sandbox company) and confirm a `payments` row appears with `source='quickbooks'`
  and the right `kind` (deposit/partial/overpayment). **This is unverified code** — expect to debug
  the payload-parsing logic (`supabase/functions/qbo-webhook/index.ts`) against what QuickBooks
  actually sends; its own header comment says as much.
- [ ] Deliberately send a payment for an invoice NOT in `qbo_invoices` (or delete the row first) and
  confirm it shows up in Settings → Payment Reconciliation Queue as unmatched, not silently lost.

## 3. Google Calendar (Phase 4)

- [ ] Settings → Google Calendar Sync → Connect, confirm "Connected" with the real account email.
- [ ] **Not yet buildable to test further** — `gcal-create-hold` and the per-artist calendar
  mapping UI don't exist yet (see `ops/GOOGLE_CALENDAR_SETUP.md` Notes). Building those is the next
  real step here, not just connecting.

## 4. Zelle QR (Phase 6 part 1 — no credentials needed, testable now)

- [ ] Settings → a payee profile → upload a real Zelle QR image, set the display name/
  instructions, save.
- [ ] Open an event for that artist with a balance due, view the balance reminder preview — confirm
  the uploaded QR (not the generated placeholder) shows, with the correct display name.
- [ ] Confirm a DIFFERENT artist's balance reminder shows THEIR OWN QR, never the one just uploaded
  (the "never cross-send" requirement) — `zelleProfileForEvent()` resolves this structurally, but
  verify it in the actual UI, not just by reading the code.

## 5. Gmail mailboxes (Phase 6 part 2)

- [ ] Settings → Gmail Mailboxes → add one artist's mailbox → Connect → confirm it shows
  "Connected."
- [ ] **Not yet buildable to test further** — no notification parser or matcher exists yet (see
  `ops/GMAIL_SETUP.md` Notes). This is the single largest remaining scoped-but-unbuilt piece of the
  whole spec.

## 6. Travel requests / Rivky (Phase 7 — no credentials needed beyond her email, testable now)

- [ ] Settings → set Rivky's real email.
- [ ] Create a lead with flight or ground transport needed, Request Travel from Rivky, fill in the
  details, Send — confirm the email actually arrives at her real address, correctly branded, with
  every filled-in detail present.
- [ ] Once she confirms a flight (by whatever channel), add it under Confirmed Flights on the
  travel request and hit Check Status (needs FlightAware connected — see #7).

## 7. FlightAware (Phase 8)

- [ ] Settings isn't where this lives — it's per-flight-segment on a travel request. Add a flight
  segment for a REAL, currently-flying (or recently landed) flight, hit Check Status, confirm a
  real status comes back (not "not connected").
- [ ] Try an invalid/made-up flight number, confirm it fails cleanly (a toast with a real error),
  not a silent no-op.

## 8. Cross-cutting

- [ ] Confirm Demo Mode (no real Supabase session) never throws a console error anywhere new this
  project touched — every new startup-time `supabaseClient` call has the same "wait for a real
  session" guard `loadBrandConfig()` was missing and got fixed for (grep the file for
  `supabaseClient.auth.getSession` if adding a new one later; check it's guarded).
- [ ] Full pytest suite green one more time before calling any of the above "done":
  `cd test-harness && pytest`.
