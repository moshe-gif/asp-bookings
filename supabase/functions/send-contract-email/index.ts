// Sends an email for the app -- contracts, booking confirmations, balance reminders, travel requests
// (frontend sendEmail() in asp.js). This function holds no email-sending credentials itself: it
// verifies the caller is a signed-in ASP admin (is_admin(), like every admin-only action), then
// forwards the already-rendered HTML to a Google Apps Script mail relay (ops/apps-script-mail-relay.gs),
// which actually calls Gmail's MailApp.sendEmail. RELAY_SECRET (never sent to the browser) is what
// the relay uses to trust this function.
//
// Sender: the brand's sender_name and reply_to from brand_config (migration 0015) for the `brand`
// the app passes ('asp' | 'sing'), the same row the app prints on documents (2026-10-09 audit 3.13).
//
// Limit (audit 1.8): at most SEND_LIMIT_PER_HOUR emails per admin per hour, counted in email_sends
// (migration 0040), which also records every send (who, to whom, subject, brand). If that table
// can't be read the send still goes out -- the limit is a guard against a runaway loop or a stolen
// session, not a reason to block the office's email.
//
// Deploy with "Enforce JWT Verification" ON. Function Secrets:
//   RELAY_URL    = the Google Apps Script Web App URL (ends in /exec)
//   RELAY_SECRET = the shared secret configured in that same script
//   REPLY_TO     = optional, only used when brand_config has no reply_to
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";
import { brandFor } from "../_shared/config.ts";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SEND_LIMIT_PER_HOUR = 60;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;

  const body = await readJson<{ to?: string; subject?: string; html?: string; brand?: string }>(req);
  if (!body) return json({ ok: false, error: "bad json" }, 400);
  const { to, subject, html } = body;
  if (!to || !subject || !html) return json({ ok: false, error: "missing fields" }, 400);
  if (typeof to !== "string" || !EMAIL_RE.test(to)) return json({ ok: false, error: "invalid recipient" }, 400);
  if (html.length > 300000) return json({ ok: false, error: "contract html too large" }, 400);

  const relayUrl = Deno.env.get("RELAY_URL");
  const relaySecret = Deno.env.get("RELAY_SECRET");
  if (!relayUrl || !relaySecret) return json({ ok: false, error: "email relay not configured yet" }, 500);

  const sb = serviceClient();
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count, error: countErr } = await sb.from("email_sends").select("id", { count: "exact", head: true })
    .eq("sent_by", auth.user.id).gte("sent_at", since);
  if (countErr) console.error("send-contract-email: send limit not checked", countErr.message);
  else if ((count ?? 0) >= SEND_LIMIT_PER_HOUR) {
    return json({ ok: false, error: `Sending limit reached (${SEND_LIMIT_PER_HOUR} emails an hour). Try again later.` }, 429);
  }

  const brand = await brandFor(sb, body.brand);
  let relayResp: Response;
  try {
    relayResp = await fetch(relayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: relaySecret, to, subject, html, fromName: brand.senderName, replyTo: brand.replyTo || undefined }),
    });
  } catch (err) {
    return json({ ok: false, error: "could not reach mail relay: " + String(err) }, 502);
  }
  const relayJson = await relayResp.json().catch(() => ({ ok: false, error: "bad relay response" }));
  if (!relayResp.ok || !relayJson.ok) return json({ ok: false, error: relayJson.error || "relay failed" }, 502);

  const { error: logErr } = await sb.from("email_sends").insert({ sent_by: auth.user.id, sent_to: to, subject: subject.slice(0, 300), brand_key: brand.key });
  if (logErr) console.error("send-contract-email: sent, but not recorded", logErr.message);
  return json({ ok: true });
});
