// The gig sheet emailed to each singer a week before the gig (owner 2026-11-09: "1 week before"). The server twin of
// gigSheetDocHtml() in the app (frontend/workspaces/asp.js): the gig's facts, run of the night, songs, notes, the
// client's other form answers and the contacts on the day -- all from the gig (events.app_doc.gigInfoSheet,
// clientForm). Inline styles only, so it survives email clients.
import { appUrl, emailHeaderHtml } from "./config.ts";

// deno-lint-ignore no-explicit-any
type Doc = Record<string, any>;
const e = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const t12 = (t: string) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || "")); if (!m) return ""; const h = Number(m[1]); return `${(h % 12) || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`; };

export function gigSheetEmailHtml(ev: Doc, artistName: string, when: string, phone: string | null): string {
  const sheet: Doc = { schedule: [], songs: [], contacts: [], text: "", ...(ev.gigInfoSheet || {}) };
  const mute = "#6B6B72", accent = "#5B78A8";
  const label = (x: string) => `<div style="font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:${accent};font-weight:700;margin:22px 0 8px;padding-bottom:6px;border-bottom:2px solid #17171A;">${x}</div>`;
  const cell = "padding:7px 12px 7px 0;border-bottom:1px solid #E3E3E8;font-size:13px;vertical-align:top;";
  const table = (rows: string) => `<table role="presentation" style="border-collapse:collapse;width:100%;">${rows}</table>`;
  const where = [ev.venue, ev.address, [ev.city, ev.state].filter(Boolean).join(", ")].filter(Boolean).join(", ");
  const time = [t12(sheet.startTime || ev.time), t12(ev.endTime)].filter(Boolean).join(" – ");
  const facts: [string, string][] = [["Date", when], ["Time", time || "TBD"], ["Venue", where || "TBD"]];
  if (ev.type) facts.push(["Event", ev.type]);
  if (ev.band) facts.push(["Band", ev.band]);
  if (sheet.choir) facts.push(["Choir", sheet.choir]);
  if (sheet.otherSingers) facts.push(["Other singers", sheet.otherSingers]);
  if (ev.dressCode) facts.push(["Dress code", ev.dressCode]);
  const extras = ((ev.clientForm || {}).sections || []).flatMap((s: Doc) => s.rows || []).filter((r: Doc) => !r.placed);
  const maps = where ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(where)}` : "";
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#F5F4EF;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17171A;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;">
    <div style="padding:20px 24px 16px;border-bottom:1px solid #E3E3E8;">${emailHeaderHtml(artistName)}
      <div style="font-size:10.5px;letter-spacing:.22em;color:${accent};font-weight:700;margin-top:6px;">GIG SHEET</div></div>
    <div style="padding:8px 24px 24px;line-height:1.5;">
      ${table(facts.map(([k, v]) => `<tr><td style="${cell}color:${mute};white-space:nowrap;width:120px;">${e(k)}</td><td style="${cell}font-weight:700;">${e(v)}</td></tr>`).join(""))}
      ${maps ? `<p style="margin:10px 0 0;font-size:13px;"><a href="${e(maps)}" style="color:#4C6FA5;">Open the venue in Maps</a></p>` : ""}
      ${(sheet.schedule || []).length ? label("Run of the night") + table(sheet.schedule.map((r: Doc) => `<tr><td style="${cell}color:${mute};white-space:nowrap;width:90px;">${e(t12(r.time) || r.time || "")}</td><td style="${cell}">${e(r.label || "")}</td></tr>`).join("")) : ""}
      ${(sheet.songs || []).length ? label("Songs") + table(sheet.songs.map((r: Doc) => `<tr><td style="${cell}color:${mute};width:180px;">${e(r.moment || "")}</td><td style="${cell}font-weight:700;">${e(r.song || "")}</td></tr>`).join("")) : ""}
      ${sheet.text ? label("Notes") + `<p style="font-size:13px;white-space:pre-wrap;margin:0;">${e(sheet.text)}</p>` : ""}
      ${extras.length ? label("From the client's form") + table(extras.map((r: Doc) => `<tr><td style="${cell}color:${mute};width:180px;">${e(r.label)}</td><td style="${cell}white-space:pre-wrap;">${e(r.value)}</td></tr>`).join("")) : ""}
      ${(sheet.contacts || []).length ? label("Contacts on the day") + table(sheet.contacts.map((c: Doc) => `<tr><td style="${cell}font-weight:700;">${e(c.name)}${c.role ? ` <span style="color:${mute};font-weight:400;">(${e(c.role)})</span>` : ""}</td><td style="${cell}text-align:right;">${c.phone ? `<a href="tel:${e(String(c.phone).replace(/[^\d+]/g, ""))}" style="color:#4C6FA5;">${e(c.phone)}</a>` : ""}</td></tr>`).join("")) : ""}
      <p style="margin:22px 0 0;font-size:13px;">The latest version is always in the app: <a href="${appUrl()}" style="color:#4C6FA5;">${appUrl().replace(/^https?:\/\//, "")}</a></p>
    </div>
    <div style="padding:12px 24px;border-top:1px solid #E3E3E8;font-size:11px;color:${mute};">ASP Management &middot; office@aspmgmt.com${phone ? ` &middot; ${e(phone)}` : ""}</div>
  </div></body></html>`;
}
