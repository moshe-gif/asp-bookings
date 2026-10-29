// The client payment section for server-sent emails (scheduled reminders): the twin of
// paymentOptionsEmailBlock() in frontend/workspaces/asp.js -- same markup, so a reminder looks like
// the contract and invoice the client already has. Keep the two in step. Owner 2026-10-14:
//   1. Pay online (card or bank transfer): the main button, when there's a link;
//   2. Zelle: "Scan here to pay the deposit/balance" with the right account's QR (ASP's for deposits
//      and invoices, the artist's payee profile for balances);
//   3. one footnote line: to pay by check or cash, call the office.

import { balancePayeeProfile, isMultiArtist } from "./connect.ts";

// deno-lint-ignore no-explicit-any
type Sb = any;
export type Zelle = { qrUrl: string | null; handle: string; note?: string };

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function moneyCents(dollars: number): string {
  return "$" + (Number(dollars) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function paymentOptionsHtml(o: { kind: "deposit" | "balance" | "invoice"; payUrl?: string | null; amount?: number | null; memo?: string; zelle?: Zelle | null; officePhone?: string | null }): string {
  const what = o.kind === "balance" ? "the balance" : o.kind === "invoice" ? "this invoice" : "the deposit";
  const amt = o.amount ? ` ${moneyCents(o.amount)}` : "";
  const label = o.kind === "invoice" ? `Pay${amt} online` : `Pay ${what}${amt ? " of" + amt : ""} online`;
  const button = o.payUrl ? `<div style="text-align:center;margin:0 0 6px;"><a href="${esc(o.payUrl)}" style="display:inline-block;background:#4C6FA5;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">${label}</a></div>
    <p style="text-align:center;font-size:11.5px;color:#67676D;margin:0 0 14px;">Card or bank transfer. No fee for bank transfer or debit cards.</p>` : "";
  const z = o.zelle || null;
  const qr = z && z.qrUrl && /^https:\/\//.test(z.qrUrl) ? esc(z.qrUrl) : "";
  const memoLine = o.memo ? ` Put “${esc(o.memo)}” in the memo so we can match your payment.` : "";
  const heading = qr ? `${o.payUrl ? "Or scan" : "Scan"} here to pay ${what} with Zelle` : `${o.payUrl ? "Or pay" : "Pay"} ${what} with Zelle`;
  const zelleBox = !z || (!qr && !z.handle) ? "" : `<table role="presentation" style="width:100%;border-collapse:separate;border:1px solid #E1E1E6;border-radius:10px;margin:0 0 10px;"><tr>
      ${qr ? `<td style="width:132px;padding:12px;vertical-align:middle;"><img src="${qr}" alt="Zelle QR code" width="120" height="120" style="display:block;width:120px;height:120px;border-radius:6px;background:#fff;"/></td>` : ""}
      <td style="padding:12px;vertical-align:middle;font-size:13px;color:#67676D;line-height:1.5;">
        <strong style="display:block;color:#17171A;font-size:14px;margin-bottom:2px;">${heading}</strong>
        ${qr ? "Open your bank app, choose Zelle, and scan." : `Send it with Zelle to <strong style="color:#17171A;">${esc(z.handle)}</strong>.`}${memoLine}
        ${z.note ? `<div style="margin-top:4px;font-size:12px;color:#9A9AA1;">${esc(z.note)}</div>` : ""}
      </td></tr></table>`;
  const foot = !o.payUrl && !zelleBox
    ? `<p style="font-size:12.5px;color:#67676D;margin:0;">To pay, please call our office${o.officePhone ? ` at ${esc(o.officePhone)}` : ""}, or use the Pay online link in our email.</p>`
    : `<p style="font-size:11.5px;color:#9A9AA1;margin:0;">* To pay by check or cash, please call our office${o.officePhone ? ` at ${esc(o.officePhone)}` : ""}.</p>`;
  return `<div class="pay-options" style="margin:18px 0 0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">${button}${zelleBox}${foot}</div>`;
}

// ASP's Zelle for deposits and invoices (Settings → Online payments, app_records settings/org), else
// ASP's house payee profile -- the same choice as depositZelle() in the app. Never an artist's.
// Settings → Online payments → "Don't offer Zelle" (owner 2026-10-29: Stripe + Mercury only) turns both off.
async function orgSettings(sb: Sb) {
  const { data } = await sb.from("app_records").select("app_doc").eq("collection", "settings").eq("legacy_id", "org").maybeSingle();
  return data?.app_doc?.value || {};
}
export async function depositZelle(sb: Sb): Promise<Zelle | null> {
  const o = await orgSettings(sb);
  if (o.zelleOff === true) return null;
  const qrUrl = typeof o.depositZelleQrUrl === "string" && /^https:\/\//.test(o.depositZelleQrUrl) ? o.depositZelleQrUrl : null;
  const handle = typeof o.depositZelleHandle === "string" ? o.depositZelleHandle.trim() : "";
  if (qrUrl || handle) return { qrUrl, handle };
  const { data: rows } = await sb.from("app_records").select("app_doc").eq("collection", "payee_profiles");
  // deno-lint-ignore no-explicit-any
  const house = (rows || []).map((r: any) => r.app_doc).find((p: any) => p && !p.artistId && /^ASP\b/i.test(p.entityName || ""));
  if (!house || house.zelleActive === false) return null;
  const hq = typeof house.zelleQrUrl === "string" && /^https:\/\//.test(house.zelleQrUrl) ? house.zelleQrUrl : null;
  const hh = (house.zelle || "").trim();
  return hq || hh ? { qrUrl: hq, handle: hh } : null;
}

// A gig's balance Zelle: its balance payee (balancePayeeProfile, the same choice as zellePayeeFor()
// in the app). Never the house's or another artist's.
// A gig with several artists gets none: one Zelle can't split the balance (they pay online, or call).
export async function balanceZelle(sb: Sb, eventLegacyId: string): Promise<Zelle | null> {
  if ((await orgSettings(sb)).zelleOff === true) return null;
  const { data: evRow } = await sb.from("events").select("app_doc").eq("legacy_id", eventLegacyId).maybeSingle();
  if (!evRow?.app_doc || isMultiArtist(evRow.app_doc)) return null;
  const p = await balancePayeeProfile(sb, eventLegacyId, evRow.app_doc);
  if (!p || p.zelleActive === false) return null;
  const qrUrl = typeof p.zelleQrUrl === "string" && /^https:\/\//.test(p.zelleQrUrl) ? p.zelleQrUrl : null;
  const handle = (p.zelle || "").trim();
  return qrUrl || handle ? { qrUrl, handle, note: p.zelleInstructions || "" } : null;
}

export async function officePhone(sb: Sb, brandKey = "asp"): Promise<string | null> {
  const { data } = await sb.from("brand_config").select("phone").eq("brand_key", brandKey).maybeSingle();
  return data?.phone || null;
}
