# supabase/ — database migrations, Edge Functions, auth email template

Project: `psgpxbkncuavlnpplykf` (Supabase dashboard). There is no Supabase CLI setup yet: everything
here is applied **by hand in the dashboard**, so this file is the record of what is live.

## Migrations (`migrations/`)
- Apply in Supabase → **SQL Editor**: paste the whole file, Run. **Strictly in number order.**
- Each file is one transaction where possible (`begin; … commit;`) so a failure changes nothing.
- When you run one, fill in its `-- Applied: <date>` header line, and update the ledger below in the
  same commit.
- Never edit a migration that has been applied; write a new one.
- Objects created only in the dashboard are drift — write them into a migration
  (known: the `rls_auto_enable()` event-trigger function).

### Ledger
| Migration | Status |
|---|---|
| 0001–0030 | Applied before 2026-10-09 (exact dates not recorded). 0004/0005 company scoping was reverted by 0006. |
| 0031 | **Pending** — security hardening (file kept out of the public repo until applied). Run first. |
| 0032_shared_events_app_doc | **Pending** — shared gig list (events.app_doc + derived columns + realtime). Run after 0031; the app's sync code ships separately. |
| 0033_payments_dedupe_constraint | **Pending** — unique (source, source_ref) on payments; needed by the updated qbo-webhook. |
| 0034_oauth_states | **Pending** — one-time OAuth state table used by oauth-start and the three callbacks. |

## Edge Functions (`functions/`)
Deploy: Supabase → Edge Functions → the function → paste the file's contents → Deploy. Secrets live
in Edge Function secrets (names in `.env.example` and each `ops/*_SETUP.md`).

| Function | Enforce JWT verification | Called by | Setup doc |
|---|---|---|---|
| admin-remove-user | ON (admin-only) | Settings → Users → Edit → Remove (deletes the login; roster row too unless history references it) | this file |
| oauth-start | ON (admin-only) | QuickBooks / Google Calendar / Gmail Connect buttons (issues the one-time OAuth state) | this file |
| send-contract-email | ON (admin-only via `is_admin()`) | contract send, booking confirmation, reminders, travel requests | `ops/SEND_CONTRACT_SETUP.md` |
| flightaware-status | ON | event-sheet flight card, travel-request segments | `ops/FLIGHTAWARE_SETUP.md` |
| qbo-oauth-callback | **OFF** (Intuit redirect has no Supabase token) | QuickBooks connect | `ops/QUICKBOOKS_SETUP.md` |
| qbo-create-invoice, qbo-status | ON | Send Contract (deposit invoice), Settings | `ops/QUICKBOOKS_SETUP.md` |
| qbo-webhook | **OFF** (signature-verified instead) | Intuit | `ops/QUICKBOOKS_SETUP.md` |
| gcal-oauth-callback | **OFF** (Google redirect) | Google Calendar connect | `ops/GOOGLE_CALENDAR_SETUP.md` |
| gcal-status, gcal-create-hold | ON | Settings, contract send | `ops/GOOGLE_CALENDAR_SETUP.md` |
| gmail-oauth-callback | **OFF** (Google redirect) | Gmail connect | `ops/GMAIL_SETUP.md` |
| gmail-status | ON | Settings | `ops/GMAIL_SETUP.md` |

**QuickBooks / Google go-live checklist** (do all of it before filling in any client ID):
1. Apply migrations 0033 and 0034.
2. Deploy `oauth-start` (new) and redeploy `qbo-oauth-callback`, `gcal-oauth-callback`,
   `gmail-oauth-callback`, `qbo-webhook`, `qbo-create-invoice` from this repo.
3. In the QuickBooks sandbox, confirm invoice idempotency (`requestid`) behaves as expected and
   which webhook payload format your Intuit app receives (the function logs unknown formats).

## Auth email template (`templates/`)
`templates/signin-code.html` is the source of truth for the sign-in code email. Supabase →
Authentication → Emails → Templates → Magic Link: paste it whenever it changes.

## References that point nowhere (historical)
`0001` mentions `BACKEND_SETUP.md` and `0010` mentions `ops/DATA_MIGRATION.md`; neither exists
(they were planned docs). The plan for moving browser data into Supabase is now: CLAUDE.md
"Where data lives" + migration 0032.
