# Mercury — money in, and each singer's share in their own account

Owner 2026-10-27: "create sub accounts that the money can automatically get split up so my payouts are easier".

ASP banks at Mercury: **one main account** (deposits, ASP's commission, Stripe payouts) and **one account
per singer**. The `mercury` Edge Function:

1. reads every account's incoming money (read-only on the bank) every 10 minutes;
2. puts each settled credit in the app's Inbox as "Money in" (bank: Mercury). An amount that is exactly a
   gig's deposit, a gig's balance or an open invoice (the payer's name breaks ties) is recorded on the
   gig automatically, like a bank's email alert; anything else waits for a click;
3. saves every recorded client payment that reached ASP — a Mercury credit applied to its gig, or a paid
   Stripe link — once in the **money ledger** (0078) with its split: across a gig's payments ASP's
   commission comes out first, then each singer's share (fee less commission, plus charges; extra
   artists their fee less ASP's cut) up to what they're owed; anything over stays with ASP. A payment
   that can't be split (no payee profile, more owed than came in, a deposit paid to a singer) is flagged
   "needs a look" in Financials and is never paid until fixed and **Re-split**.

**Payouts are monthly** (owner 2026-11-04: "i dont want each gig to have a payout ... monthly i want to
payout artists amount and send the commission to ilan chase account"). Financials → **Monthly Payouts**
→ pick the month → **Send** (owner, COO or bookkeeping; it asks once to confirm). It takes every unpaid
part that landed by that month's end: **one transfer per singer** (main account → their Mercury
account, `request-transfer`) and **one ACH payment of the commission** to the recipient picked in
Settings → Bank (Mercury) → "Commission goes to" (`request-send-money`). Each waits for approval in
Mercury. A payout row's id is Mercury's idempotency key, so nothing is sent twice; money recorded late
rolls into the next month. A gig is marked **Paid Out** once its singers' money is sent.

Until `MERCURY_LIVE=yes`, Send only shows what it would send (the app's test mode). Mercury's sandbox
moves sandbox money.

## Setup

1. Mercury → open the singers' accounts (Accounts → Open account), named after each singer.
2. Mercury → Settings → API Tokens → create a **Custom Scopes** token with no IP list (done 2026-10-29):
   Fetch Depository Accounts, Fetch Transactions, Fetch Recipients, Fetch Transfer Money Requests,
   Transfer Money with Approval, Send Money with Approval. Scopes marked * need a fixed-IP list, which
   Supabase Edge Functions can't have, so none are used. An approved share becomes a Mercury
   "request-transfer" that waits for approval in Mercury by a user other than the token's creator.
3. Copy the token, then in Terminal: `~/asp-bookings/supabase/set-secret.sh MERCURY_API_TOKEN` (reads it from
   the clipboard; never paste it in chat or the repo). Optional: `MERCURY_API_BASE=https://api-sandbox.mercury.com/api/v1` with a sandbox token.
4. Apply `supabase/migrations/0067_mercury_split.sql` and `0078_monthly_payouts.sql`; deploy: `supabase/deploy-function.sh mercury client-pay`.
5. App → Settings → Bank (Mercury) → **Check the bank now**, then set each account: ASP main account, or
   whose payee profile it belongs to.
6. Schedule it (every 10 minutes, same as inbox-scan; the CRON_SECRET header):
   `select cron.schedule('mercury-sync', '*/10 * * * *', $$ ... $$);` — copy the inbox-scan job's command
   with the URL changed to `/functions/v1/mercury`.
7. Commission account: Mercury → Payments → Recipients → add the outside account (e.g. Ilan's Chase,
   ACH details). Then Settings → Bank (Mercury) → "Choose from Mercury recipients" → pick it.
8. Going live (owner's word only): `MERCURY_LIVE=yes`.

## Stripe with Mercury

Settings → Bank (Mercury) → "Balances paid online go to" → **ASP, then split into singers' Mercury
accounts**: balance pay links charge ASP's own Stripe account (no per-singer Stripe accounts needed), the
row is marked `payout_via = 'mercury'`, and its split is saved once the gig is recorded paid. In Stripe,
set ASP's payout bank to the Mercury **main** account. Stripe's payouts arrive as lumps of many
payments: they show in the Inbox as "Stripe payout" and are never matched to a gig (Stripe already
recorded each payment).

## Caveats

- The old per-gig proposals (`mercury_transfers`, Inbox "Singers' shares to move") are retired; the table
  stays as history.
- A credit recorded by hand on the gig (not via its Inbox row or a pay link) isn't in the ledger.
- Stripe's own processing fee comes out of its payout, so the commission figure is before that fee.
- Account and routing numbers are never stored by the app; put each singer's account details in their
  payee profile if clients should pay balances straight into it.
