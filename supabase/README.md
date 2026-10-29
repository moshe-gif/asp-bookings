# supabase/ — database migrations, Edge Functions, auth email template

Project: `psgpxbkncuavlnpplykf` (Supabase dashboard). There is no Supabase CLI setup yet: everything
here is applied **by hand in the dashboard**, so this file is the record of what is live.

## Migrations (`migrations/`)
- Apply with `supabase/run-sql.sh <file>` (or Supabase → **SQL Editor**: paste the whole file, Run). **Strictly in number order.**
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
| 0031_rls_and_security_advisor_fixes | Applied 2026-10-10 — payee/activity-log RLS, orphaned artist write policies, Security Advisor fixes (ERROR gone; remaining WARNs are the intended `authenticated` grants on the RLS helper functions). |
| 0032_shared_events_app_doc | Applied 2026-10-10 — shared gig list (events.app_doc + derived columns + realtime); the app syncs gigs through it since 2026-10-10. |
| 0033_payments_dedupe_constraint | Applied 2026-10-10 — unique (source, source_ref) on payments. |
| 0034_oauth_states | Applied 2026-10-10 — one-time OAuth state table. |
| 0035_app_records_shared_collections | Applied 2026-10-11 — generic admin-only `app_records` (collection, legacy_id, app_doc) + realtime; the app syncs contracts, payee profiles, projects, invoices, external events, documents and travel requests through it. The older relational `contracts`/`payee_profiles` tables are legacy snapshots nothing reads. |
| 0037_artists_roster_owner | Applied 2026-10-11 — `artists` is the roster's one owner (the app loads it at sign-in and it wins); email optional; Shmili Landau's row added. |
| 0036_app_records_settings | Applied 2026-10-11 — adds collection `settings` (office settings + pricing, one row each: `org`, `pricing`). |
| 0038_artist_portal_views | Applied 2026-10-12 — `artist_gig_view` + `artist_finance_view` (security-barrier views scoped by `current_artist_id()`) for the artist portal. Check: `0038_test_artist_isolation.sql` (rolls back; must say ALL OK). |
| 0039_artist_finance_view_nulls | Applied 2026-10-12 (isolation check ALL OK) — fixes two NULL bugs in `artist_finance_view` found by the 0038 isolation check (solo gigs had no money; shared gigs showed $0 instead of nothing). |
| 0040_email_sends_and_brand_email | Applied 2026-10-12 — `email_sends` (send log + 60/hour/admin limit for send-contract-email); ASP brand office email filled in. |
| 0041_gmail_tables_service_role | Applied 2026-10-12 — service_role grants on `gmail_mailboxes` / `gmail_oauth_tokens` (the Gmail functions were failing with permission denied). |
| 0042_artist_commission_pct | Applied 2026-10-12 — `artists.commission_pct` (default 15, Dovie 10); prefills each gig's commission. |
| 0043_artist_finance_package_scope | Applied 2026-10-12 — a client-package `priceScope` counts as shared in `artist_finance_view` (isolation check ALL OK). |
| 0044_office_email_everywhere | Applied 2026-10-12 — reply-to and office email = office@aspmgmt.com for both brands (owner). |
| 0045_email_sends_service_role | Applied 2026-10-12 — service_role can record/count sends (first real send went out unlogged). |
| 0046_service_role_table_access | Applied 2026-10-12 — service_role gets the standard table access (it had none: Edge Function writes/reads were failing or silently empty). |
| 0047_artist_gig_view_office_days | Applied 2026-10-12 — artists also see their office days (`unpaid` internal days; no money row); never leads (owner). |
| 0048_qbo_connection | Applied 2026-10-12 — recreates `qbo_connection` (0009's table was missing from the database); service role only. |
| 0049_tighten_client_grants | Applied 2026-10-12 — audit 1.4 safe slice: anon/authenticated lose TRUNCATE/TRIGGER/REFERENCES everywhere (TRUNCATE skips RLS), write grants on the read-only artist views, and all access to the token tables; same for future tables. Isolation check ALL OK after. |
| 0050_artist_directory | Applied 2026-10-13 — name-only `artist_directory` view for every signed-in user; artist sessions read it (v1.9.1). |
| 0051_artists_own_row_only | Applied 2026-10-13 (after v1.9.1 went live) — artists read only their own `artists` row; other artists' emails and commission rates are admin-only. |
| 0052_contract_sign_requests | Applied 2026-10-13 — clients sign contracts online: `contract_sign_requests` + `sign_contract_request()` (service role only). See `ops/CONTRACT_SIGN_SETUP.md`. |
| 0053_drop_artist_bookings_rpc | Applied 2026-10-13 — drops `artist_bookings()` (any artist could call it and get their leads + fee columns); activity_log's artist read now scopes through `artist_gig_view`. Isolation check ALL OK. |
| 0054_rls_auth_uid_once | Applied 2026-10-13 — five RLS policies evaluate auth.uid() once per query (performance advisor); duplicate user_settings read policy dropped. Isolation check ALL OK. |
| 0055_remove_sing_brand | Applied 2026-10-13 — SING Entertainment removed (owner): its `brand_config` row deleted, brand_key limited to 'asp'. No records used it. |
| 0056_payment_requests | Applied 2026-10-13 — clients pay online (Stripe): `payment_requests` (deposit on the signing link's token, or a custom invoice's own link), `append_event_log()` (service role only), `payments.source` gains 'stripe'. See `ops/STRIPE_SETUP.md`. |
| 0057_payment_claims | Applied 2026-10-13 — payments hardened after review: `payment_requests.applied_at` (one admin browser applies a paid deposit), `claim_payment_attempt()` (one pay attempt at a time per contract/invoice; service role only). |
| 0058_client_followups | Applied 2026-10-14 — log of automatic client reminders (deposit / balance, every 7 days) written by the client-followups job; enables pg_cron. Service role writes, admins read. |
| 0059_brand_public_storage | Applied 2026-10-14 — public Storage bucket `brand-public` (admins upload; anyone reads) for images that go out in client emails: the Zelle QR codes (Gmail won't show data: images). |
| 0060_artist_itinerary_view | Applied 2026-10-15 — artist_gig_view adds `travel` (primary artist only, like flight) and `gig_sheet`, so artists see their itinerary and gig sheet. Isolation check ALL OK (non-primary gets no travel). |
| 0062_inbox_items | Applied 2026-10-15 — inbox watch: `inbox_items` (one row per office email, classified + matched to a gig by the inbox-scan job) and `inbox_scan_state`. pg_cron job `inbox-scan` runs every 10 minutes (reads only). |
| 0063_stripe_payees | Applied 2026-10-16 — balances paid online straight to the artist (Stripe Connect): `stripe_payees` (one Stripe Express account per payee profile, server-written), payment link kind `event_balance` + `payee_profile_id`, guard and `claim_payment_attempt` updated. |
| 0064_money_in | Applied 2026-10-22 — money in from email: inbox-scan reads every connected Gmail mailbox (per-mailbox read position, new type `payments` read only for payment mail) and stores on each payment email what it pays (`inbox_items.money`: invoice / deposit / balance, exact or not, bank DKIM-verified); `money_applied_at` makes recording it once-only. |
| 0066_artist_collect_at_event | Applied 2026-10-27 — the artist's gig info shows what to collect at the event on a gig not paid the standard way (Mezumin = cash): `artist_gig_view` gains `collect_method` / `collect_note` / `collect_amount` (main artist only, booked, balance not received; amount = the client balance, `ev.depositPaid` counting as deposit), plus the `asp_num()` safe-number helper. (0065 is on the gap-fixes branch, not yet applied.) |
| 0067_mercury_split | Applied 2026-10-27 — Mercury: `mercury_accounts` (ASP's main account / each singer's payee account; ids and names only, never account numbers), `mercury_transactions` (incoming credits read by the `mercury` function), `mercury_transfers` (each artist's share of a balance paid into ASP's main account, proposed → approved → sent; once per payment and payee), `mercury_sync_state`; `payment_requests.payout_via`. Admins read; only the function writes. |
| 0068_video_library | Applied 2026-10-28 — the video library: `library_singers` (its own list, seeded from the roster's 5 singers), `library_tags` (event / tempo / lifestyle options, seeded), `library_videos`, `library_video_tags`; public bucket `library` (5 GB a file; the project's upload limit was raised to 5 GB). Anyone reads live singers, published videos and tags (the public /videos/ page); only admins write. |
| 0069_crew_and_private_library | Applied 2026-10-28 — crew accounts: `crew_members` (kind social / videographer; linked by email, or by `claim_crew_account()` at sign-in), `gig_crew` (videographer requests; written only by the `crew` function), `crew_gig_view` (gigs without any money column: social sees every booked / contract-sent gig, a videographer only his own). The video library becomes private: `admin_users.library_access` (owner, Ilan) and crew can watch (`can_view_library()`), the same admins and social crew manage it (`can_manage_library()`); bucket `library` is private (signed links). Who is crew / has access is set by SQL outside the repo (personal emails). |
| 0070_crew_hardening | Applied 2026-10-28 — after review: `library_access` can only be changed by SQL (trigger `guard_library_access`), only library admins add or change crew (`is_library_admin()`), crew read each other through `crew_directory` (no emails / phones). |
| 0071_whatsapp_inbox | Applied 2026-10-29 — the owner's WhatsApp tab: `whatsapp_messages` (every message in or out; written by `_shared/whatsapp.ts` and `whatsapp-webhook`, read with `admin_users.whatsapp_access` via `can_use_whatsapp()`; on Realtime); the 0070 trigger now guards `whatsapp_access` too (SQL only). |
| 0072_deposit_confirmations | Applied 2026-10-29 — `client_followups.kind` adds `deposit_confirmed` (the WhatsApp "deposit received, booking confirmed", sent once per gig by `client-followups {only:"deposit_confirmations"}`, pg_cron job `deposit-confirmations` every 10 minutes); the 106 gigs whose deposit was already in were marked done ('baseline', nothing sent). |
| 0073_whatsapp_media_contacts | Applied 2026-10-29 — `whatsapp_messages.media_id` / `media_mime` (incoming photos, voice notes, videos, documents open in the tab through `whatsapp-send` "media"); `whatsapp_contacts` (names the owner gives a number; WhatsApp access only). |
| 0074_library_drive_backup | Applied 2026-10-29 — Video Library backup to Google Drive (office@aspmgmt.com): `drive_backup` (the one connection + run lock), `library_drive_folders`, `library_drive_files` (progress per video, resumable upload link); all service role only. `oauth_states` allows 'gdrive'. Cron job `library-drive-backup` every 10 minutes (copied from inbox-scan's command). |
| 0075_removable_logins | Applied 2026-10-29 — every foreign key to `auth.users` that blocked deleting a login (NO ACTION) is now SET NULL (`user_settings`: CASCADE), so Settings → Users → Remove works for people with history. |

## Edge Functions (`functions/`)
Deploy: `supabase/deploy-function.sh <name>` (or `all`). Every function imports the shared modules in
`functions/_shared/` (CORS locked to the app's origin, admin check, service client, app URL + brand,
OAuth state, QuickBooks token, pinned supabase-js), so pasting one file into the dashboard no longer
works. Secrets live in Edge Function secrets (names in `.env.example` and each `ops/*_SETUP.md`);
`ALLOWED_ORIGINS` (optional, comma-separated) adds browser origins beyond `APP_URL` and localhost.

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
| client-pay | **OFF** (clients have no account; gated by the link token) | `/sign/` deposit, `/pay/` invoice | `ops/STRIPE_SETUP.md` |
| stripe-webhook | **OFF** (Stripe-Signature verified instead) | Stripe | `ops/STRIPE_SETUP.md` |
| stripe-status | ON (admin-only) | Settings, Send Contract, invoices | `ops/STRIPE_SETUP.md` |

**QuickBooks / Google go-live checklist** (do all of it before filling in any client ID):
1. ~~Apply migrations 0033 and 0034~~ — done 2026-10-10.
2. ~~Deploy `oauth-start` and the updated callbacks / webhook / invoice functions~~ — done 2026-10-10.
3. ~~Create `qbo_connection`~~ — done 2026-10-12 (0048).
4. In the QuickBooks sandbox, confirm invoice idempotency (`requestid`) behaves as expected and
   which webhook payload format your Intuit app receives (the function logs unknown formats).

## Auth email template (`templates/`)
`templates/signin-code.html` is the source of truth for the sign-in code email. Supabase →
Authentication → Emails → Templates → Magic Link: paste it whenever it changes.

## References that point nowhere (historical)
`0001` mentions `BACKEND_SETUP.md` and `0010` mentions `ops/DATA_MIGRATION.md`; neither exists
(they were planned docs). The plan for moving browser data into Supabase is now: CLAUDE.md
"Where data lives" + migration 0032.

## Auth settings (2026-10-10)
Open sign-ups are OFF (`disable_signup`) — staff are created in Authentication → Add user and linked
to their roster row by email. Leaked-password protection (HaveIBeenPwned) is ON.
