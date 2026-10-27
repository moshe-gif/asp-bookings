# Setup: chat intake endpoint (`intake-lead`)

Lets another system drop a booking message (the usual 4-5 line "who, what, when, where, price"
message) into the app as a **new lead for the office to review**. The message is read the same way
as New Lead → "Fill from message", and the lead lands in **Needs Review** flagged "From chat intake
-- review before use", with the original message kept on it. It sends nothing: no email, no
calendar hold, no invoice, no flight request. (It is posted to Axis like any other new gig — see
the note at the top of `supabase/functions/intake-lead/index.ts`.)

**Pointing a chat tool (WhatsApp, Slack, etc.) at this endpoint is a separate, later step. Nothing
calls it yet.**

## Part 1 — Database (once)

Apply `supabase/migrations/0065_thanks_and_chat_intake.sql` in Supabase → SQL Editor (it also holds
the thank-you change), then add `-- Applied: <date>` to its header.

## Part 2 — Secret (~2 min)

1. Make a long random secret on your own computer, e.g. in Terminal: `openssl rand -hex 32`
   (64 characters; anything under 32 characters is refused).
2. Supabase dashboard → **asp-bookings** project → **Edge Functions → Secrets** → add
   `INTAKE_SECRET` = that value. Keep it only there and in the system that will call the endpoint;
   never in this repo, a chat, or a screenshot.
3. `ANTHROPIC_API_KEY` is already set (parse-lead uses it).

Without `INTAKE_SECRET` the endpoint refuses every call.

## Part 3 — Deploy

`supabase/deploy-function.sh intake-lead` (deploys with JWT verification OFF: the caller has no app
login, the secret is the check). Redeploy `parse-lead` too, since its reading code moved into
`_shared/leadparse.ts`.

## Example call (placeholder secret)

```bash
curl -sS -X POST https://psgpxbkncuavlnpplykf.supabase.co/functions/v1/intake-lead \
  -H "Content-Type: application/json" \
  -H "x-intake-secret: <INTAKE_SECRET>" \
  -d '{"idempotency_key":"chat-msg-000123","text":"Wedding for the Cohen family\nDec 14 2026, 7pm\nArtist Name\nThe Atrium, Monsey NY\n$8500"}'
```

Answer: `{"ok":true,"id":"EV-5201","open":"#/needs_review","created":true}`. Open the app at
`https://app.aspmgmt.com/#/needs_review` to review it. No gig details are echoed back.

## Rules the endpoint enforces

- Only `POST`, `Content-Type: application/json`, body up to 16 KB, message up to 6,000 characters.
- Server-to-server only: no CORS answer, and any request with a browser `Origin` header is refused.
- `idempotency_key` (8-200 letters, digits, `. _ : -`) is required. Sending the same key again
  returns the same lead with `"created": false` and creates nothing — use the chat message's id.
- At most 20 new leads an hour (`429 rate limited` after that).
- The message must name a roster artist, a client and a date, like New Lead's own Save; otherwise
  `422` and nothing is created.
- The EV- number is allocated inside the database in one locked step, so two calls at once can't
  take the same number.
