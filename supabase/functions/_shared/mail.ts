// The one way server code sends email, as the brand's sender with its reply-to:
//  - Resend (preferred, 2026-10-14): secret RESEND_API_KEY. aspmgmt.com is verified there (DKIM +
//    send.aspmgmt.com), so mail goes out as office@aspmgmt.com and Resend reports delivery/bounces.
//  - otherwise the Google Apps Script relay (ops/apps-script-mail-relay.gs): RELAY_URL / RELAY_SECRET.
// Returns ok (+ the provider's message id when there is one) or the error.
import { brandFor } from "./config.ts";
// deno-lint-ignore no-explicit-any
type Sb = any;

export async function sendRelayEmail(sb: Sb, msg: { to: string; subject: string; html: string; brand?: string }): Promise<{ ok: boolean; error?: string; brandKey?: string; id?: string }> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (resendKey) {
    const brand = await brandFor(sb, msg.brand);
    const from = `${brand.senderName} <${Deno.env.get("MAIL_FROM") || "office@aspmgmt.com"}>`;
    let resp: Response;
    try {
      resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, html: msg.html, ...(brand.replyTo ? { reply_to: brand.replyTo } : {}) }),
      });
    } catch (err) {
      return { ok: false, error: "could not reach Resend: " + String(err) };
    }
    const out = await resp.json().catch(() => ({}));
    if (!resp.ok) return { ok: false, error: `Resend: ${out.message || out.name || resp.status}` };
    return { ok: true, brandKey: brand.key, id: out.id };
  }
  const relayUrl = Deno.env.get("RELAY_URL");
  const relaySecret = Deno.env.get("RELAY_SECRET");
  if (!relayUrl || !relaySecret) return { ok: false, error: "email relay not configured yet" };
  const brand = await brandFor(sb, msg.brand);
  let resp: Response;
  try {
    resp = await fetch(relayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: relaySecret, to: msg.to, subject: msg.subject, html: msg.html, fromName: brand.senderName, replyTo: brand.replyTo || undefined }),
    });
  } catch (err) {
    return { ok: false, error: "could not reach mail relay: " + String(err) };
  }
  const out = await resp.json().catch(() => ({ ok: false, error: "bad relay response" }));
  if (!resp.ok || !out.ok) return { ok: false, error: out.error || "relay failed" };
  return { ok: true, brandKey: brand.key };
}
