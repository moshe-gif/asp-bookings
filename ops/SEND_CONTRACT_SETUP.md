# Setup: "Send Contract" email

Two things need to be deployed, in order. Neither requires installing anything locally --
both are done entirely in a browser.

## Part 1 — Google Apps Script mail relay (~10 min)

This is the piece that actually sends the email, riding a normal Gmail account.

1. Sign in to the Google account contract emails should send **from** (a personal Gmail is
   fine -- clients will see a Reply-To of the office address regardless, set in Part 2).
2. Go to **script.google.com** → **New project**.
3. Delete the placeholder code and paste in the contents of `ops/apps-script-mail-relay.gs`
   (from this repo).
4. Top left, rename the project to something like "ASP Contract Mail Relay".
5. Left sidebar → **Project Settings** (gear icon) → scroll to **Script Properties** →
   **Add script property**:
   - Property: `SHARED_SECRET`
   - Value: a long random string -- e.g. run `openssl rand -hex 32` in any terminal, or use
     a password generator for a 40+ character string. Save this value; you'll need it in Part 2.
6. Back in the editor: **Deploy** (top right) → **New deployment**.
   - Click the gear next to "Select type" → **Web app**.
   - Description: anything, e.g. "v1"
   - Execute as: **Me**
   - Who has access: **Anyone**
     (This sounds open, but the script itself rejects any request that doesn't include the
     exact `SHARED_SECRET` from step 5 -- see the `doPost` check in the script.)
7. Click **Deploy**. Authorize the requested Gmail permissions when prompted (this is your own
   script asking to send mail as you).
8. Copy the **Web app URL** shown (ends in `/exec`). Keep this and the secret from step 5
   together -- you'll enter both in Part 2.

## Part 2 — Supabase Edge Function (~5 min)

This is the piece the app itself calls. It checks the request is really from a logged-in ASP
admin, then forwards to the relay from Part 1.

1. Log in to the Supabase dashboard for the **asp-bookings** project.
2. Left sidebar → **Edge Functions** → **Deploy a new function**.
3. Name it exactly: `send-contract-email`
4. Paste in the contents of `supabase/functions/send-contract-email/index.ts` (from this repo)
   as the function code, then **Deploy**.
5. Still on that function's page, go to **Secrets** (or Project Settings → Edge Functions →
   Secrets, depending on dashboard version) and add:
   - `RELAY_URL` = the Web app URL from Part 1, step 8
   - `RELAY_SECRET` = the `SHARED_SECRET` value from Part 1, step 5
   - `REPLY_TO` = `billing@aspmgmt.com` (or whichever office address replies should land at --
     optional, but recommended so client replies don't go to a personal Gmail)
6. Save. No redeploy needed for secret changes.

## Done

Once both parts are set, the "Send Contract" button in the app will work with no further setup.
Reply back once this is live and Moshe will wire up and test the send button on the app side.
