# Setup: clients sign contracts online

Live since 2026-10-13. Step 1 of the "one link" flow (sign, then pay); step 2, paying the deposit
on the same page, is in `ops/STRIPE_SETUP.md`.

## How it works
1. An admin emails a contract from the Contract Builder (or clicks **Signing link** to copy one for
   a contract sent another way). The app makes a random link,
   `https://app.aspmgmt.com/sign/#<token>`, and saves a frozen copy of the contract's wording with
   it (`contract_sign_requests`, migration 0052). The email gets a **Review & sign online** button.
2. The client opens the link (no account, no login), reads the contract, types their name, ticks the
   consent box and signs. Page: `frontend/sign/index.html`. Server: Edge Function `contract-sign`.
3. The server records who signed, when, from which IP/device, the consent text, and a SHA-256 of the
   exact wording (the record an e-signature needs under the ESIGN Act / UETA). It emails the client a
   signed copy (to the address it was sent to and any address they typed) and the office a notice
   (reply-to address in `brand_config`), and notes it on the gig's activity log.
4. Every signed-in admin's app marks the contract **Signed** ("Signed online by …", live) -- only if
   the client signed the contract's *current* terms. A signature to terms that have changed since
   shows a warning instead, and editing the money after signing flags the signature "(terms changed
   since)".

Rules worth knowing:
- A new link to **changed** wording cancels any unsigned older link for that contract (the client
  can't sign old terms). A new link to the same wording leaves the emailed one working. Deleting or
  voiding a contract, revoking its approval, or re-approving it with new terms cancels its open links.
- Links expire after 90 days. A **void** or deleted contract can't be signed. A signed contract gets
  no new links; after changing its terms, set it back to Sent to send the new version for signing.
- The first signature to a given set of terms stands; signing again returns it.
- A signature can't be changed, undone or revoked -- not even by an admin (database trigger).
- Paying the deposit still counts as acceptance where the contract has the Acceptance clause.

## Deploy / redeploy
- Migration: `supabase/run-sql.sh supabase/migrations/0052_contract_sign_requests.sql` (done).
- Function: `supabase/deploy-function.sh contract-sign` -- deployed with **JWT verification OFF**
  (clients have no Supabase account). The security boundary is the 32-byte random token, stored
  only as its SHA-256. Uses the `RELAY_URL` / `RELAY_SECRET` secrets already set for
  send-contract-email; nothing new to configure.

## Testing
`test-harness/test_client_signing.py` signs a real link end to end. Harness links use contract ids
`CT-TEST-…` (never a real contract) and send no email. Admins can't delete links, so after a run
remove the test rows with:
`delete from contract_sign_requests where contract_legacy_id like 'CT-TEST-%';` (run-sql.sh).
