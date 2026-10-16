// Sets up an artist's payee profile to receive balances paid online (Stripe Connect, migration 0063,
// ops/STRIPE_SETUP.md). Admin only. The artist does the actual setup (bank, tax details, ID) on
// Stripe's own pages, from a link the office sends them (/payouts/#<token>, Edge Function
// payee-onboard); ASP never sees those details.
//
//   POST { action: "refresh" }                                    -> every payee's Stripe status, re-read from Stripe
//   POST { action: "setup", payeeProfileId, shareFrom?, email?, send? }
//        -> makes the payee's Stripe account (or uses the account of `shareFrom`, another payee profile
//           of the same company) and a fresh 30-day setup link; with send and email, emails it.
//   POST { action: "unlink", payeeProfileId }                     -> forgets the payee's account (the Stripe
//                                                                    account itself stays; nothing is paid to it)
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";
import { appUrl, brandLogoHtml } from "../_shared/config.ts";
import { sendRelayEmail } from "../_shared/mail.ts";
import { stripeApi, stripeConfigured, stripeMode } from "../_shared/stripe.ts";
import { accountStatus, refreshPayeeAccount } from "../_shared/connect.ts";

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SETUP_DAYS = 30;
const COLS = "payee_profile_id, stripe_account_id, entity_name, setup_expires_at, setup_email, details_submitted, transfers_active, payouts_enabled, requirements_due, disabled_reason, checked_at, livemode, updated_at";

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;
  const body = await readJson<{ action?: string; payeeProfileId?: string; shareFrom?: string; email?: string; send?: boolean }>(req);
  if (!body) return json({ ok: false, error: "bad request" }, 400);
  const sb = serviceClient();

  if (body.action === "refresh") {
    if (stripeConfigured()) {
      const { data: rows } = await sb.from("stripe_payees").select("stripe_account_id");
      const accounts = [...new Set((rows || []).map((r: { stripe_account_id: string }) => r.stripe_account_id))];
      await Promise.all(accounts.map((a) => refreshPayeeAccount(sb, a as string)));
    }
    const { data, error } = await sb.from("stripe_payees").select(COLS);
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, payees: data || [] });
  }

  if (typeof body.payeeProfileId !== "string" || !ID_RE.test(body.payeeProfileId)) return json({ ok: false, error: "Pick a payee profile." }, 400);
  const id = body.payeeProfileId;

  if (body.action === "unlink") {
    const { error } = await sb.from("stripe_payees").delete().eq("payee_profile_id", id);
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true });
  }
  if (body.action !== "setup") return json({ ok: false, error: "unknown action" }, 400);
  if (!stripeConfigured()) return json({ ok: false, error: "Online payments aren't set up yet (Settings → Online payments)." }, 409);

  // The payee profile, as the office has it now (the shared copy).
  const { data: rec } = await sb.from("app_records").select("app_doc").eq("collection", "payee_profiles").eq("legacy_id", id).maybeSingle();
  const profile = rec?.app_doc;
  if (!profile || profile.id !== id) return json({ ok: false, error: "That payee profile isn't saved yet — save it, then try again." }, 404);
  if (!profile.artistId && /^ASP\b/i.test(profile.entityName || "")) return json({ ok: false, error: "This is ASP's own profile: ASP's money already goes to ASP's Stripe account." }, 400);
  const email = typeof body.email === "string" && EMAIL_RE.test(body.email.trim()) ? body.email.trim().slice(0, 200) : null;

  // A test-mode account is never reused with the live key (or the reverse): it doesn't exist there.
  const live = stripeMode() === "live";
  const { data: existing } = await sb.from("stripe_payees").select("stripe_account_id, livemode").eq("payee_profile_id", id).maybeSingle();
  let accountId: string | null = existing && existing.livemode === live ? existing.stripe_account_id : null;
  if (!accountId && typeof body.shareFrom === "string" && ID_RE.test(body.shareFrom)) {
    const { data: other } = await sb.from("stripe_payees").select("stripe_account_id, livemode").eq("payee_profile_id", body.shareFrom).maybeSingle();
    if (!other || other.livemode !== live) return json({ ok: false, error: "That other profile has no Stripe account yet." }, 404);
    accountId = other.stripe_account_id;
  }
  let status: Record<string, unknown> = accountId ? { livemode: live } : {};
  if (!accountId) {
    // An Express account that can only RECEIVE transfers from ASP (no card payments of its own): the
    // lightest setup for the artist. ASP covers Stripe's fees and is responsible for refunds and
    // disputes on the payments it takes (the client pays ASP).
    const made = await stripeApi("POST", "/accounts", {
      // No email here (the artist gives Stripe theirs during setup): a retry with the same key must send
      // the same parameters, or Stripe refuses it.
      country: "US",
      controller: { fees: { payer: "application" }, losses: { payments: "application" }, requirement_collection: "stripe", stripe_dashboard: { type: "express" } },
      capabilities: { transfers: { requested: true } },
      business_profile: { name: String(profile.entityName || "").slice(0, 100) || undefined },
      metadata: { payee_profile_id: id, entity_name: String(profile.entityName || "").slice(0, 200) },
    }, `asp-payee-${id}-${stripeMode()}-${Date.now() - (Date.now() % 3_600_000)}`);
    if (!made.ok) {
      const msg = made.data?.error?.message || `Stripe answered ${made.status}`;
      console.error("stripe-connect: create account", msg);
      return json({ ok: false, error: /connect/i.test(msg) ? `Stripe Connect isn't turned on for ASP's Stripe account yet (Stripe dashboard → Connect → Get started). Stripe said: ${msg}` : `Stripe didn't make the account: ${msg}` }, 502);
    }
    accountId = made.data.id;
    status = accountStatus(made.data);
  }

  const token = newToken();
  const row = {
    payee_profile_id: id, stripe_account_id: accountId, entity_name: profile.entityName || null,
    setup_token_hash: await sha256Hex(token), setup_expires_at: new Date(Date.now() + SETUP_DAYS * 86_400_000).toISOString(),
    ...(email ? { setup_email: email } : {}), updated_at: new Date().toISOString(), ...status,
    ...(existing ? {} : { created_by: auth.user.id }),
  };
  const { error: upErr } = await sb.from("stripe_payees").upsert(row, { onConflict: "payee_profile_id" });
  if (upErr) return json({ ok: false, error: `Couldn't save the Stripe account: ${upErr.message}` }, 500);
  if (accountId && !Object.keys(status).length) await refreshPayeeAccount(sb, accountId);
  const url = `${appUrl()}/payouts/#${token}`;

  let sent = false, sendError: string | undefined;
  if (body.send) {
    if (!email) return json({ ok: false, error: "Enter the email to send the setup link to." }, 400);
    const html = `<div style="max-width:560px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14px;color:#17171A;line-height:1.55;">
<div style="padding-bottom:14px;border-bottom:2px solid #17171A;margin-bottom:18px;">${brandLogoHtml(200)}</div>
<p>Hi,</p>
<p>ASP Management now takes balance payments online, and they go straight to your bank account. To receive them for <strong>${esc(profile.entityName || "you")}</strong>, please set up your payouts with Stripe, our payment processor. It takes about 5 minutes: you'll need the bank account you want paid into and your tax ID (EIN or SSN).</p>
<p style="text-align:center;margin:22px 0;"><a href="${esc(url)}" style="display:inline-block;background:#4C6FA5;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">Set up my payouts</a></p>
<p style="color:#67676D;font-size:12.5px;">Your details go to Stripe directly; ASP never sees them. The link works for ${SETUP_DAYS} days. Questions? Just reply to this email.</p></div>`;
    const out = await sendRelayEmail(sb, { to: email, subject: "Set up your payouts from ASP Management", html, brand: "asp" });
    sent = out.ok; sendError = out.error;
  }
  const { data: saved } = await sb.from("stripe_payees").select(COLS).eq("payee_profile_id", id).maybeSingle();
  return json({ ok: true, url, payee: saved, sent, sendError });
});
