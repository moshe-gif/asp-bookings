// The client's side of online signing (migration 0052): app.aspmgmt.com/sign/#<token> calls this to
// show the contract and to sign it. No login -- the client is not an ASP user.
//
// Deploy with JWT verification OFF (the client has no Supabase session). The security boundary is
// the token: 32 random bytes made by an admin's browser, emailed to the client, and stored here only
// as a SHA-256, so it can't be guessed and a database read can't produce a working link. The token
// travels in the POST body (never a URL query string), so it stays out of request logs.
//
//   POST { action: "view", token }                          -> the frozen contract HTML + status
//   POST { action: "sign", token, name, email?, agree }     -> records the signature (once)
//
// After a signature: the office gets a notice and the client gets a signed copy (the ESIGN Act asks
// that the signer can keep one), through the same mail relay as send-contract-email. Those emails are
// best-effort -- the signature is already recorded, and the page also lets the client print/save it.
//
// Function Secrets: RELAY_URL, RELAY_SECRET (shared with send-contract-email).
import { sendRelayEmail } from "../_shared/mail.ts";
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { serviceClient } from "../_shared/auth.ts";
import { brandFor } from "../_shared/config.ts";

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;  // 32 bytes, base64url, no padding
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Shown next to the checkbox and stored with each signature. Includes the disclosures the ESIGN Act
// asks for when the signer is a consumer (paper option, withdrawing consent, what's needed to keep a copy).
export const CONSENT_TEXT =
  "I agree to sign this contract electronically: my typed name is my signature and has the same effect as a handwritten one. " +
  "I understand I can instead ask for a paper copy to sign by replying to the email that brought me here, that I can withdraw " +
  "this consent at any time before signing simply by not signing, and that I need a web browser to view, print or save this contract.";

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// The whole forwarding chain, as received (capped): its first entry is whatever the client's side
// claims, the later ones are added by the proxies in front of this function. Recorded, not trusted.
function clientIp(req: Request): string | null {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "";
  return ip.trim().slice(0, 200) || null;
}

// The record of the signature, appended to the contract for the signed copy.
function certificateHtml(r: { signer_name: string; signed_at: string; signer_ip: string | null; html_sha256: string; id: string }): string {
  const when = new Date(r.signed_at).toUTCString();
  return `<div style="max-width:640px;margin:16px auto 0;background:#fff;padding:20px 32px;border-radius:10px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:12px;line-height:1.6;color:#45454B;">
<div style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#9A9AA1;font-weight:700;margin-bottom:6px;">Electronic signature record</div>
<div><span style="font-family:'Snell Roundhand','Segoe Script','Brush Script MT',cursive;font-size:1.6rem;color:#17171A;">${escapeHtml(r.signer_name)}</span></div>
<div>Signed electronically by <strong>${escapeHtml(r.signer_name)}</strong> on ${escapeHtml(when)}${r.signer_ip ? ` from ${escapeHtml(r.signer_ip)}` : ""}.</div>
<div>${escapeHtml(CONSENT_TEXT)}</div>
<div style="color:#9A9AA1;word-break:break-all;">Document SHA-256: ${r.html_sha256} &middot; Record ${r.id}</div>
</div>`;
}

function signedCopy(html: string, cert: string): string {
  return html.includes("</body>") ? html.replace("</body>", cert + "</body>") : html + cert;
}

// Sends through the app's one mail path (_shared/mail.ts: Resend, else the Apps Script relay) as the
// brand's sender. Never throws: a failed email is logged, the payment/signature is already recorded.
async function relay(to: string, subject: string, html: string, _fromName: string, _replyTo: string | null, brandKey?: string): Promise<boolean> {
  const out = await sendRelayEmail(serviceClient(), { to, subject, html, brand: brandKey });
  if (!out.ok) console.error("email failed", subject, out.error);
  return out.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  const body = await readJson<{ action?: string; token?: string; name?: string; email?: string; agree?: boolean }>(req);
  if (!body || typeof body.token !== "string" || !TOKEN_RE.test(body.token)) {
    return json({ ok: false, error: "not_found" }, 404);
  }
  const sb = serviceClient();
  const tokenHash = await sha256Hex(body.token);

  if (body.action === "view") {
    const { data: r, error } = await sb.from("contract_sign_requests")
      .select("id, contract_legacy_id, contract_created_at, terms_sha256, client_name, brand_key, rendered_html, html_sha256, expires_at, revoked_at, first_viewed_at, signed_at, signer_name, signer_ip")
      .eq("token_hash", tokenHash).maybeSingle();
    if (error) { console.error("contract-sign view", error.message); return json({ ok: false, error: "server" }, 500); }
    if (!r) return json({ ok: false, error: "not_found" }, 404);
    if (!r.signed_at && r.revoked_at) return json({ ok: false, error: "revoked" }, 410);
    if (!r.signed_at && new Date(r.expires_at) <= new Date()) return json({ ok: false, error: "expired" }, 410);
    if (!r.signed_at && !r.contract_legacy_id.startsWith("CT-TEST-")) {
      const { data: rec } = await sb.from("app_records").select("app_doc").eq("collection", "contracts").eq("legacy_id", r.contract_legacy_id).maybeSingle();
      const doc = rec?.app_doc;
      if (!doc || doc.createdAt !== r.contract_created_at || doc.status === "void") return json({ ok: false, error: "void" }, 410);
      if ((await sha256Hex(doc.approvedTermsFingerprint || "")) !== r.terms_sha256) return json({ ok: false, error: "revoked" }, 410);
    }
    if (!r.first_viewed_at) await sb.from("contract_sign_requests").update({ first_viewed_at: new Date().toISOString() }).eq("id", r.id);
    const brand = await brandFor(sb, r.brand_key || undefined);
    return json({
      ok: true,
      contractId: r.contract_legacy_id,
      clientName: r.client_name || "",
      brandName: brand.senderName,
      html: r.signed_at ? signedCopy(r.rendered_html, certificateHtml(r)) : r.rendered_html,
      consentText: CONSENT_TEXT,
      signed: r.signed_at ? { name: r.signer_name, at: r.signed_at } : null,
    });
  }

  if (body.action === "sign") {
    const name = (body.name || "").trim().replace(/\s+/g, " ");
    const email = (body.email || "").trim();
    if (body.agree !== true) return json({ ok: false, error: "consent_required" }, 400);
    if (name.length < 2 || name.length > 120) return json({ ok: false, error: "name_required" }, 400);
    if (email && (email.length > 200 || !EMAIL_RE.test(email))) return json({ ok: false, error: "bad_email" }, 400);

    const ip = clientIp(req);
    const { data: res, error } = await sb.rpc("sign_contract_request", {
      p_token_hash: tokenHash, p_name: name, p_email: email || null, p_ip: ip,
      p_user_agent: req.headers.get("user-agent") || "", p_consent: CONSENT_TEXT,
    });
    if (error) { console.error("contract-sign sign", error.message); return json({ ok: false, error: "server" }, 500); }
    if (!res.ok) return json({ ok: false, error: res.error }, res.error === "not_found" ? 404 : 410);
    if (res.already) return json({ ok: true, signed: { name: res.signer_name, at: res.signed_at } });

    // The two emails. Never fail the response over them: the signature is recorded.
    const { data: r } = await sb.from("contract_sign_requests")
      .select("id, contract_legacy_id, client_name, client_email, brand_key, rendered_html, html_sha256, signed_at, signer_name, signer_ip")
      .eq("id", res.id).single();
    // Test-harness links (contract id "CT-TEST-…", never a real contract) send no email.
    if (r && !r.contract_legacy_id.startsWith("CT-TEST-")) {
      const brand = await brandFor(sb, r.brand_key || undefined);
      const copy = signedCopy(r.rendered_html, certificateHtml(r));
      const tasks: Promise<unknown>[] = [];
      // The address the contract was sent to, and the one the signer typed for their copy.
      const clientTo = [...new Set([r.client_email, email].filter((a): a is string => !!a && EMAIL_RE.test(a)).map((a) => a.toLowerCase()))];
      for (const to of clientTo) {
        tasks.push(relay(to, `Your signed contract with ${brand.senderName}`, copy, brand.senderName, brand.replyTo));
      }
      if (brand.replyTo) {
        const notice = `<p style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14px;">
${escapeHtml(r.signer_name)} signed contract <strong>${escapeHtml(r.contract_legacy_id)}</strong>${r.client_name ? ` (${escapeHtml(r.client_name)})` : ""} online on ${escapeHtml(new Date(r.signed_at).toUTCString())}. Open ASP Bookings to see it on the contract. The signed copy follows.</p>${copy}`;
        tasks.push(relay(brand.replyTo, `Signed: ${r.contract_legacy_id}${r.client_name ? " — " + r.client_name : ""}`, notice, "ASP Bookings", null));
      }
      await Promise.all(tasks);
    }
    return json({ ok: true, signed: { name: res.signer_name, at: res.signed_at } });
  }

  return json({ ok: false, error: "unknown action" }, 400);
});
