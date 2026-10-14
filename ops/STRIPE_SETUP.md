# Setup: clients pay online (Stripe)

Built 2026-10-13. Step 2 of the "one link" flow: the client signs (step 1, `ops/CONTRACT_SIGN_SETUP.md`),
then pays the deposit on the same page. Custom invoices get their own pay link.

## How it works
1. **Contract deposit.** In **Send Contract**, tick **Let the client pay the deposit online**. The
   email's button becomes **Review, sign & pay online**. The same link (`/sign/#<token>`) carries a
   payment row (`payment_requests`, migration 0056) with the deposit amount and card fee frozen in it.
   After signing, the page shows **Pay your deposit**.
2. **Custom invoice.** **Financials → + New Invoice → Send Invoice** emails the invoice with a
   **Pay online** button (`/pay/#<token>`) when Stripe is connected. **Pay link** on the invoice copies it.
3. The client enters a card or bank account in Stripe's own fields (Stripe.js; ASP never sees card
   numbers) and presses **Continue**. The server asks Stripe what was entered and shows the total:
   - **Bank transfer (ACH):** no fee to the client. ASP pays Stripe's 0.8% (max $5).
   - **Credit card:** the card fee from Settings (0–3%), on its own line, before they press Pay.
   - **Debit or prepaid card:** never a fee (card-network rules).
   Apple Pay / Google Pay are off, since their payment sheet shows the amount before the card's fee
   is known.
4. **Pay** charges exactly the total shown (`client-pay`). A card is recorded at once; a bank transfer
   shows "processing" and is recorded when it clears days later (`stripe-webhook`).
5. When the money arrives the server writes the payments ledger (`payments`, source `stripe`), a
   receipt to the client (fee on its own line) and a notice to the office. The office app then marks
   the **deposit received** (status Booked, a line on the gig's activity log, and the client's booking
   confirmation, just as with Verify Deposit) or the **invoice paid**: `applyClientPayments()`. With
   several admins signed in, exactly one browser does it (it claims the payment, `applied_at`, 0057).
   If no admin is signed in, it happens the next time one opens the app.
6. A refund or dispute (made in Stripe's dashboard) flags the payment and emails the office. Nothing in
   the app is undone automatically.

Rules worth knowing:
- One payment per contract or invoice: a second link for something already paid says "Already paid",
  and only one pay attempt runs at a time across all its links (`claim_payment_attempt`, 0057).
- The deposit can only be paid once the contract is signed, to the terms it still has approved. A
  void or deleted contract/invoice, changed terms, a deposit already verified by hand (Verify Deposit)
  or an invoice marked paid by hand can't be paid online; the app also cancels those links.
- If Stripe can't be reached mid-payment, the client is told to wait and reload instead of retrying;
  the next attempt first looks the charge up in Stripe. Should a client still be charged twice, the
  second charge goes in the ledger as needs-review and the office gets an "Action needed" email.
- Bank transfers use instant verification only (the client logs in to their bank in Stripe's window).
- Links expire after 90 days, like signing links.

## Card fee: before turning it on
The fee is **0% until you set it** (Settings → Online payments). Before setting it above 0:
- Notify Visa and Mastercard at least 30 days ahead (ask Stripe support how; there's a short form).
- The fee applies to credit cards only, can't exceed 3% (or your actual cost), and must be disclosed
  before payment — the page does this.
- Connecticut and Massachusetts ban surcharges: the send dialog leaves the fee off for gigs in CT/MA
  (the gig's state, "Conn."/"Mass." and full names included) and warns when a gig has no state. Custom
  invoices have no state: tick **No credit card fee on this invoice** for a client there.
- Not legal advice; check with your accountant.

## One-time setup (owner)
1. Create a Stripe account at stripe.com (business details + the bank account for payouts). Turn on
   **ACH Direct Debit** under Settings → Payment methods.
2. Developers → API keys. Set the keys as Supabase secrets (never paste them in chat or commit them):
   ```
   ! supabase/set-secret.sh STRIPE_SECRET_KEY        # sk_live_… (or sk_test_… to try it first)
   ! supabase/set-secret.sh STRIPE_PUBLISHABLE_KEY   # pk_live_… (or pk_test_…)
   ```
3. Developers → Webhooks → Add endpoint:
   `https://psgpxbkncuavlnpplykf.supabase.co/functions/v1/stripe-webhook`, events
   `payment_intent.succeeded`, `payment_intent.processing`, `payment_intent.payment_failed`,
   `payment_intent.canceled`, `charge.refunded`, `charge.dispute.created`. Then set its signing secret:
   `! supabase/set-secret.sh STRIPE_WEBHOOK_SECRET` (whsec_…).
4. Settings → Online payments in the app should say **Connected (live)**.

Test keys first is recommended: everything works the same with test card 4242 4242 4242 4242, and the
client page shows a "Test mode" note. Swap in the live keys when ready.

## Deploy / redeploy
- Migration: `supabase/run-sql.sh supabase/migrations/0056_payment_requests.sql` (done).
- Functions: `supabase/deploy-function.sh client-pay stripe-webhook stripe-status`. `client-pay` and
  `stripe-webhook` have **JWT verification OFF** (the client and Stripe have no Supabase session):
  the boundaries are the link token (stored only as its SHA-256) and the webhook signature.
- Mail goes through the `RELAY_URL` / `RELAY_SECRET` secrets already set for send-contract-email.

## Testing
`test-harness/test_client_payments.py`. With test keys set it pays a deposit with Stripe's test card
end to end; without keys it checks the page says online payment isn't available. It never pays in live
mode. Harness rows use `CT-TEST-…` / `INV-TEST-…` ids, send no email and write no ledger or gig log.
Clean up after a run:
`delete from payment_requests where contract_legacy_id like 'CT-TEST-%' or invoice_legacy_id like 'INV-TEST-%';`
then the signing rows as in `ops/CONTRACT_SIGN_SETUP.md`.
