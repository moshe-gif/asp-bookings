// The one way server code sends email, as the brand's sender with its reply-to, first match wins:
//  - Gmail (owner's choice, 2026-10-14): the "ASP sending mailbox" (gmail_mailboxes.mailbox_type =
//    'asp_sending', e.g. office@aspmgmt.com) once it is connected in Settings with send permission.
//    Mail goes out of that Gmail account itself, so it also appears in its Sent folder.
//    Secrets GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET (to refresh the access token).
//  - Resend: secret RESEND_API_KEY. aspmgmt.com is verified there (DKIM +
//    send.aspmgmt.com), so mail goes out as office@aspmgmt.com and Resend reports delivery/bounces.
//  - otherwise the Google Apps Script relay (ops/apps-script-mail-relay.gs): RELAY_URL / RELAY_SECRET.
// Returns ok (+ the provider's message id when there is one) or the error.
import { brandFor } from "./config.ts";
// deno-lint-ignore no-explicit-any
type Sb = any;

// RFC 2047 header word, so names and subjects with non-ASCII characters survive.
const hdr = (s: string) => /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(new TextEncoder().encode(s))}?=`;
function b64(bytes: Uint8Array): string { let bin = ""; for (const b of bytes) bin += String.fromCharCode(b); return btoa(bin); }
const b64url = (bytes: Uint8Array) => b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// The connected sending mailbox and a live access token, or null when none is connected.
async function gmailSender(sb: Sb): Promise<{ email: string; token: string } | null> {
  const { data: box } = await sb.from("gmail_mailboxes").select("id, email").eq("mailbox_type", "asp_sending").limit(1).maybeSingle();
  if (!box) return null;
  const { data: tok } = await sb.from("gmail_oauth_tokens").select("access_token, refresh_token, access_token_expires_at").eq("gmail_mailbox_id", box.id).maybeSingle();
  if (!tok) return null;
  if (Date.parse(tok.access_token_expires_at) - Date.now() > 120_000) return { email: box.email, token: tok.access_token };
  const clientId = Deno.env.get("GMAIL_CLIENT_ID"), clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: tok.refresh_token, grant_type: "refresh_token" }),
  });
  const t = await resp.json().catch(() => ({}));
  if (!resp.ok || !t.access_token) { console.error("Gmail token refresh failed", t.error || resp.status); return null; }
  await sb.from("gmail_oauth_tokens").update({ access_token: t.access_token, access_token_expires_at: new Date(Date.now() + (t.expires_in || 3600) * 1000).toISOString(), updated_at: new Date().toISOString() }).eq("gmail_mailbox_id", box.id);
  return { email: box.email, token: t.access_token };
}

export async function sendRelayEmail(sb: Sb, msg: { to: string; subject: string; html: string; brand?: string }): Promise<{ ok: boolean; error?: string; brandKey?: string; id?: string }> {
  const gmail = await gmailSender(sb);
  if (gmail) {
    const brand = await brandFor(sb, msg.brand);
    const mime = [
      `From: ${hdr(brand.senderName)} <${gmail.email}>`,
      `To: ${msg.to}`,
      ...(brand.replyTo && brand.replyTo.toLowerCase() !== gmail.email.toLowerCase() ? [`Reply-To: ${brand.replyTo}`] : []),
      `Subject: ${hdr(msg.subject)}`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      b64(new TextEncoder().encode(msg.html)).replace(/(.{76})/g, "$1\r\n"),
    ].join("\r\n");
    const resp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST", headers: { Authorization: `Bearer ${gmail.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: b64url(new TextEncoder().encode(mime)) }),
    });
    const out = await resp.json().catch(() => ({}));
    if (resp.ok) return { ok: true, brandKey: brand.key, id: out.id };
    console.error("Gmail send failed; trying the next sender", out.error?.message || resp.status);
  }
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
