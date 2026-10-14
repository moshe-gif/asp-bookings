// Fresh client links for server-sent emails (the scheduled reminders): the server twin of
// createSignLink() / createInvoicePayLink() in the app. The database keeps only token hashes, so a
// reminder can't reuse the link the client was first sent; it mints a new one to the SAME thing:
//  - mintContractLink: a new signing link with the same frozen contract wording, terms and gig as the
//    contract's newest open link (the old link keeps working: 0052 only cancels links to DIFFERENT
//    wording), plus the same deposit (amount and card fee) on it if the contract has an unpaid one.
//  - mintInvoiceLink: a new /pay/ link with the same frozen invoice, amount and card fee.
// Service role only (these write rows the app's admins normally create).
import { appUrl } from "./config.ts";

// deno-lint-ignore no-explicit-any
type Sb = any;
export type MintResult = { ok: true; url: string; withPay: boolean } | { ok: false; error: string };

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const PAID = ["processing", "paid", "refunded", "disputed"];

// Refuses (nothing inserted) when there's nothing left to ask the client for: the contract is void or
// deleted ("void"), its terms changed since the link was made ("terms_changed" -- the office sends the
// new version), or the deposit is already in, by any method ("paid"). A new link lasts the usual 90
// days from now.
export async function mintContractLink(sb: Sb, contractLegacyId: string, contractCreatedAt: string): Promise<MintResult> {
  const now = new Date().toISOString();
  const { data: rec } = await sb.from("app_records").select("app_doc").eq("collection", "contracts").eq("legacy_id", contractLegacyId).maybeSingle();
  const doc = rec?.app_doc;
  if (!doc || doc.createdAt !== contractCreatedAt || doc.status === "void") return { ok: false, error: "void" };
  const { data: links, error } = await sb.from("contract_sign_requests")
    .select("id, terms_sha256, event_legacy_id, brand_key, client_name, client_email, rendered_html, revoked_at, signed_at, expires_at, created_at")
    .eq("contract_legacy_id", contractLegacyId).eq("contract_created_at", contractCreatedAt).order("created_at", { ascending: false });
  if (error) return { ok: false, error: `load links: ${error.message}` };
  // deno-lint-ignore no-explicit-any
  const src = (links || []).find((l: any) => (l.signed_at || !l.revoked_at) && l.expires_at > now);
  if (!src) return { ok: false, error: "no_open_link" };   // cancelled, expired or never sent: the office sends a new one
  if ((await sha256Hex(doc.approvedTermsFingerprint || "")) !== src.terms_sha256) return { ok: false, error: "terms_changed" };
  if (src.event_legacy_id) {
    const { data: ev } = await sb.from("events").select("app_doc").eq("legacy_id", src.event_legacy_id).maybeSingle();
    if (ev?.app_doc?.depositReceived) return { ok: false, error: "paid" };
  }

  const token = newToken(), tokenHash = await sha256Hex(token);
  const { error: insErr } = await sb.from("contract_sign_requests").insert({
    token_hash: tokenHash, contract_legacy_id: contractLegacyId, contract_created_at: contractCreatedAt,
    terms_sha256: src.terms_sha256, event_legacy_id: src.event_legacy_id, brand_key: src.brand_key,
    client_name: src.client_name, client_email: src.client_email, rendered_html: src.rendered_html,
  });
  if (insErr) return { ok: false, error: `new link: ${insErr.message}` };

  // The deposit, unless it's already paid (or paying) through any link.
  const { data: pays } = await sb.from("payment_requests").select("*")
    .eq("contract_legacy_id", contractLegacyId).eq("contract_created_at", contractCreatedAt).order("created_at", { ascending: false });
  // deno-lint-ignore no-explicit-any
  const paid = (pays || []).some((p: any) => PAID.includes(p.pay_status));
  // deno-lint-ignore no-explicit-any
  const dep = !paid && (pays || []).find((p: any) => !p.revoked_at);
  let withPay = false;
  if (dep) {
    const { error: pErr } = await sb.from("payment_requests").insert({
      token_hash: tokenHash, kind: "contract_deposit", contract_legacy_id: contractLegacyId, contract_created_at: contractCreatedAt,
      event_legacy_id: dep.event_legacy_id, brand_key: dep.brand_key, client_name: dep.client_name, client_email: dep.client_email,
      description: dep.description, amount_cents: dep.amount_cents, card_fee_bps: dep.card_fee_bps,
    });
    if (pErr) console.error("paylinks: deposit row", pErr.message);
    else withPay = true;
  }
  return { ok: true, url: `${appUrl()}/sign/#${token}`, withPay };
}

// Refuses for a void, deleted or already-paid invoice (paid online or marked paid by the office).
export async function mintInvoiceLink(sb: Sb, invoiceLegacyId: string, invoiceCreatedAt: string): Promise<MintResult> {
  const { data: rec } = await sb.from("app_records").select("app_doc").eq("collection", "invoices").eq("legacy_id", invoiceLegacyId).maybeSingle();
  const inv = rec?.app_doc;
  if (!inv || (inv.createdTs || inv.createdAt) !== invoiceCreatedAt || inv.status === "void") return { ok: false, error: "void" };
  if (inv.status === "paid") return { ok: false, error: "paid" };
  const { data: pays, error } = await sb.from("payment_requests").select("*")
    .eq("invoice_legacy_id", invoiceLegacyId).eq("invoice_created_at", invoiceCreatedAt).order("created_at", { ascending: false });
  if (error) return { ok: false, error: `load links: ${error.message}` };
  // deno-lint-ignore no-explicit-any
  if ((pays || []).some((p: any) => PAID.includes(p.pay_status))) return { ok: false, error: "paid" };
  // deno-lint-ignore no-explicit-any
  const src = (pays || []).find((p: any) => !p.revoked_at);
  if (!src) return { ok: false, error: "no_open_link" };
  const token = newToken();
  const { error: insErr } = await sb.from("payment_requests").insert({
    token_hash: await sha256Hex(token), kind: "invoice", invoice_legacy_id: invoiceLegacyId, invoice_created_at: invoiceCreatedAt,
    rendered_html: src.rendered_html, brand_key: src.brand_key, client_name: src.client_name, client_email: src.client_email,
    description: src.description, amount_cents: src.amount_cents, card_fee_bps: src.card_fee_bps,
  });
  if (insErr) return { ok: false, error: `new link: ${insErr.message}` };
  return { ok: true, url: `${appUrl()}/pay/#${token}`, withPay: true };
}
