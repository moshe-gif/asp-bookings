// The artist's side of setting up payouts (Stripe Connect, migration 0063, ops/STRIPE_SETUP.md). The
// /payouts/ page calls this with the token from the setup link the office sent (stripe-connect). No
// login -- the artist isn't an ASP user. Deploy with JWT verification OFF; the boundary is the token,
// stored only as its SHA-256, valid 30 days.
//
//   POST { action: "view",  token }  -> whose payouts these are and whether setup is done
//   POST { action: "start", token }  -> where to go next: Stripe's setup form while setup is unfinished,
//                                       or (once it's done) Stripe's own Express sign-in page. This token
//                                       never opens the artist's dashboard itself: a forwarded setup
//                                       email must not let someone change where the payouts go.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { serviceClient } from "../_shared/auth.ts";
import { appUrl } from "../_shared/config.ts";
import { stripeApi, stripeConfigured, stripeMode } from "../_shared/stripe.ts";
import { refreshPayeeAccount } from "../_shared/connect.ts";

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  const body = await readJson<{ action?: string; token?: string }>(req);
  if (!body || typeof body.token !== "string" || !TOKEN_RE.test(body.token)) return json({ ok: false, error: "not_found" }, 404);
  const sb = serviceClient();
  const { data: row, error } = await sb.from("stripe_payees").select("*").eq("setup_token_hash", await sha256Hex(body.token)).maybeSingle();
  if (error) { console.error("payee-onboard load", error.message); return json({ ok: false, error: "server" }, 500); }
  if (!row) return json({ ok: false, error: "not_found" }, 404);
  if (new Date(row.setup_expires_at) <= new Date()) return json({ ok: false, error: "expired" }, 410);
  if (!stripeConfigured()) return json({ ok: false, error: "unavailable" }, 503);

  const acct = await refreshPayeeAccount(sb, row.stripe_account_id);
  if (!acct) return json({ ok: false, error: "server" }, 502);
  const done = !!acct.details_submitted && acct.capabilities?.transfers === "active";

  if (body.action === "view") {
    return json({
      ok: true, entityName: row.entity_name || "", testMode: stripeMode() === "test",
      detailsSubmitted: !!acct.details_submitted, done,
      pending: !!acct.details_submitted && !done,
      payoutsEnabled: !!acct.payouts_enabled,
    });
  }
  if (body.action !== "start") return json({ ok: false, error: "unknown action" }, 400);

  if (acct.details_submitted) return json({ ok: true, url: "https://connect.stripe.com/express_login" });
  const back = `${appUrl()}/payouts/#${body.token}`;
  const link = await stripeApi("POST", "/account_links", {
    account: row.stripe_account_id, type: "account_onboarding", refresh_url: back, return_url: back,
    collection_options: { fields: "currently_due" },
  });
  if (!link.ok) { console.error("payee-onboard account link", link.status, link.data?.error?.message); return json({ ok: false, error: "server" }, 502); }
  return json({ ok: true, url: link.data.url });
});
