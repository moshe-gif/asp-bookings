// Whether online payments (Stripe, migration 0056) are set up, for Settings and the send dialogs.
// Admin only; never returns a key. "connected" means the secret key works (Stripe answered).
import { jsonFor, preflight } from "../_shared/http.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { stripeApi, stripeConfigured, stripeMode } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;

  if (!stripeConfigured()) return json({ ok: true, connected: false, configured: false });
  const acct = await stripeApi("GET", "/account");
  if (!acct.ok) return json({ ok: true, connected: false, configured: true, error: acct.data?.error?.message || `Stripe answered ${acct.status}` });
  return json({
    ok: true, connected: true, configured: true, mode: stripeMode(),
    chargesEnabled: !!acct.data.charges_enabled,
    accountName: acct.data.settings?.dashboard?.display_name || acct.data.business_profile?.name || null,
    webhook: !!Deno.env.get("STRIPE_WEBHOOK_SECRET"),
  });
});
