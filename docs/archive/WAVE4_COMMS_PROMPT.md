Working directory: /Users/sonnenscheinfam/asp-bookings

Moshe wants real email, SMS, and WhatsApp sending. This is Wave 4 of the backend plan — read
`CLAUDE.md` and `INTEGRATIONS.md` §1 (email) and §11 (SMS/phone) before starting; those sections
already carry the proven picks and gotchas.

## What already exists to build on
- The app already has a "mocked send, logs an activity entry" convention throughout
  (flight-status updates, contract/reminder/booking-confirmation emails — see
  `renderReminderPreview()`/`renderBookingConfirmationPreview()` and the flight-check flow in
  `frontend/index.html`). The goal here is to make the SEND real without changing the UI/preview
  pattern — same "preview, then send" shape, just a real API call behind the button instead of a
  toast-only mock.
- `backend/proxy.js` already has a real `verifyIdToken()` (Supabase JWT verification) and an
  AES-256-GCM encrypted-state pattern for any secret that needs to persist server-side.

## What to build
1. **Email**: wire `INTEGRATIONS.md` §1's proven HTTPS relay (Apps Script web app) into a real
   `proxy.js` route (`/api/send-email` or similar) — the browser calls it with a verified session
   token, the proxy holds the relay URL+secret and does the actual `MailApp.sendEmail` call.
   Replace each mocked-send call site (search for where a "success" toast is shown for an email
   today with no real HTTP request behind it) with a real call, keeping the same activity-log
   entry on success.
2. **SMS**: Twilio, same proxy-gated pattern — `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` in `.env`,
   never in the browser.
3. **WhatsApp**: Twilio's WhatsApp Business API is the default pick (same account/credentials as
   SMS, avoids standing up a separate Meta Cloud API app) — confirm with Moshe before committing
   to it if a concrete reason favors Meta's API directly (e.g. template-approval turnaround).
4. Every send needs a real failure channel per `INTEGRATIONS.md`'s meta-rules — don't let a failed
   send look like a success in the UI.

Run the test harness before commit+push. A real send is hard to cover in the harness without a
real test inbox/phone number — at minimum, mock the proxy call in a way that proves the browser
sent the right request, and note in `test-harness/README.md`'s "known gaps" that the actual
external delivery isn't covered end-to-end (same honesty standard as the existing "real auth path
isn't covered" note there).
