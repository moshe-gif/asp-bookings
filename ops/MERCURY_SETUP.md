# Mercury — money in, and each singer's share in their own account

Owner 2026-10-27: "create sub accounts that the money can automatically get split up so my payouts are easier".

ASP banks at Mercury: **one main account** (deposits, ASP's commission, Stripe payouts) and **one account
per singer**. The `mercury` Edge Function:

1. reads every account's incoming money (read-only on the bank) every 10 minutes;
2. puts each settled credit in the app's Inbox as "Money in" (bank: Mercury). An amount that is exactly a
   gig's deposit, a gig's balance or an open invoice (the payer's name breaks ties) is recorded on the
   gig automatically, like a bank's email alert; anything else waits for a click;
3. once a gig's **balance** that landed in ASP's **main** account (or was paid online to ASP's own Stripe,
   see below) is recorded, it proposes each artist's whole share — fee less commission, plus the gig's
   charges; extra artists their fee less ASP's cut — as a transfer from the main account to that
   singer's account. Inbox → "Singers' shares to move" → **Approve** moves it (owner, COO or bookkeeping
   only). A balance paid straight into a singer's own account needs no transfer.

Nothing moves without an approval. Until `MERCURY_LIVE=yes`, approving on the real bank only records
what would have moved (the app's test mode). Mercury's sandbox moves sandbox money.

## Setup

1. Mercury → open the singers' accounts (Accounts → Open account), named after each singer.
2. Mercury → Settings → API Tokens → create a token. Read-only is enough to watch money come in; to let
   approvals move money between ASP's own accounts it must allow moving money. Allow the Supabase
   Edge Functions' IPs if Mercury asks for an IP allow-list (or leave it unrestricted).
3. Supabase → Edge Functions → Secrets: `MERCURY_API_TOKEN` = the token. (Never paste it in chat or
   the repo.) Optional: `MERCURY_API_BASE=https://api-sandbox.mercury.com/api/v1` with a sandbox token.
4. Apply `supabase/migrations/0067_mercury_split.sql`; deploy: `supabase/deploy-function.sh mercury client-pay`.
5. App → Settings → Bank (Mercury) → **Check the bank now**, then set each account: ASP main account, or
   whose payee profile it belongs to.
6. Schedule it (every 10 minutes, same as inbox-scan; the CRON_SECRET header):
   `select cron.schedule('mercury-sync', '*/10 * * * *', $$ ... $$);` — copy the inbox-scan job's command
   with the URL changed to `/functions/v1/mercury`.
7. Going live (owner's word only): `MERCURY_LIVE=yes`. Later, to skip the approval click:
   `MERCURY_AUTO_SPLIT=yes`.

## Stripe with Mercury

Settings → Bank (Mercury) → "Balances paid online go to" → **ASP, then split into singers' Mercury
accounts**: balance pay links charge ASP's own Stripe account (no per-singer Stripe accounts needed), the
row is marked `payout_via = 'mercury'`, and the share is proposed once the gig is recorded paid. In Stripe,
set ASP's payout bank to the Mercury **main** account. Stripe's payouts arrive as lumps of many
payments: they show in the Inbox as "Stripe payout" and are never matched to a gig (Stripe already
recorded each payment).

## Caveats

- If a gig's deposit was paid to the singer instead of ASP, the full share overpays them: check before
  approving (the deposit is assumed to be ASP's).
- A credit recorded by hand on the gig (not via its Inbox row) doesn't propose a transfer.
- Account and routing numbers are never stored by the app; put each singer's account details in their
  payee profile if clients should pay balances straight into it.
