// The ASP-branded shell every client email from the server uses (deposit / balance reminders in
// client-followups, the post-event thank-you in send-thanks): logo, white card, sign-off, footer.
// `lines` are HTML paragraphs -- escape anything typed with esc() before passing it in.
import { brandLogoHtml } from "./config.ts";

export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function emailHtml(o: { greeting: string; lines: string[]; button?: { label: string; url: string }; payment?: string; phone: string; signoff?: string }) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#F5F4EF;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17171A;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;">
    <div style="padding:20px 24px 14px;border-bottom:1px solid #E3E3E8;">${brandLogoHtml(180)}</div>
    <div style="padding:24px;font-size:14px;line-height:1.6;">
      <p style="margin:0 0 12px;">${esc(o.greeting)}</p>
      ${o.lines.map((l) => `<p style="margin:0 0 12px;">${l}</p>`).join("")}
      ${o.button ? `<p style="margin:18px 0;"><a href="${esc(o.button.url)}" style="display:inline-block;background:#4C6FA5;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;">${esc(o.button.label)}</a></p>` : ""}
      ${o.payment || ""}
      <p style="margin:18px 0 0;">${esc(o.signoff || "Thank you,")}<br/>ASP Management</p>
    </div>
    <div style="padding:12px 24px;border-top:1px solid #E3E3E8;font-size:11px;color:#6B6B72;">ASP Management &middot; office@aspmgmt.com${o.phone ? ` &middot; ${esc(o.phone)}` : ""}</div>
  </div></body></html>`;
}
