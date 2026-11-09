// The gig sheet emailed to each singer a week before the gig (owner 2026-11-09: "1 week before"). The server twin of
// gigSheetDocHtml() in the app (frontend/workspaces/asp.js): the gig's facts, run of the night, songs, notes, the
// client's other form answers and the contacts on the day -- all from the gig (events.app_doc.gigInfoSheet,
// clientForm). Inline styles only, so it survives email clients.
import { appUrl, emailHeaderHtml } from "./config.ts";

// deno-lint-ignore no-explicit-any
type Doc = Record<string, any>;
const e = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const t12 = (t: string) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || "")); if (!m) return ""; const h = Number(m[1]); return `${(h % 12) || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`; };

const HOWS = ["Sung", "Instrumental", "We'll send a track"];
function splitSong(line: string) {
  const parts = String(line || "").split(" · ").map((x) => x.trim()).filter(Boolean);
  const [title, version] = String(parts[0] || "").split(" — ");
  return { title: title || "", version: version || "", how: parts.slice(1).find((p) => HOWS.includes(p)) || "", notes: parts.slice(1).filter((p) => !HOWS.includes(p)) };
}

// Easy to read on a phone (owner 2026-11-09): the essentials big first, the run of the night, the music in order
// (song big, version / sung-instrumental under it, notes highlighted), the yes/no requests as tags, who to call.
// Same layout as gigSheetDocHtml() in the app.
export function gigSheetEmailHtml(ev: Doc, artistName: string, when: string, phone: string | null): string {
  const sheet: Doc = { schedule: [], songs: [], contacts: [], text: "", ...(ev.gigInfoSheet || {}) };
  const ink = "#0B1B2B", mute = "#5A6573", rule = "#DDE1E6", navy = "#0F2D52";
  const label = (x: string) => `<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${mute};font-weight:700;margin:26px 0 10px;padding-bottom:8px;border-bottom:2px solid ${ink};">${x}</div>`;
  const sched = [...(sheet.schedule || [])].sort((a: Doc, b: Doc) => String(a.time || "99").localeCompare(String(b.time || "99")));
  const chuppah = sched.find((r: Doc) => /chuppah|chupa/i.test(r.item || ""));
  const start = t12(sheet.startTime || ev.time);
  const where = [ev.address, [ev.city, ev.state].filter(Boolean).join(", ")].filter(Boolean).join(", ");
  const maps = (ev.venue || where) ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([ev.venue, where].filter(Boolean).join(", "))}` : "";
  const tile = (k: string, v: string, sub = "") => `<td style="width:50%;padding:12px 14px;border:1px solid ${rule};vertical-align:top;"><div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${mute};font-weight:700;">${k}</div><div style="font-size:20px;font-weight:600;line-height:1.25;margin-top:4px;">${v}</div>${sub ? `<div style="font-size:13px;color:${mute};margin-top:2px;">${sub}</div>` : ""}</td>`;
  const facts = `<table role="presentation" style="width:100%;border-collapse:collapse;margin-top:14px;"><tr>${tile("Date", e(when))}${tile("Band starts", e(start || "TBD"))}</tr><tr>${chuppah ? tile("Chuppah", e(t12(chuppah.time) || "TBD")) : tile("Event", e(ev.type || ""))}${tile("Hall", e(ev.venue || "TBD"), `${e(where)}${maps ? ` · <a href="${e(maps)}" style="color:${navy};font-weight:600;">Maps</a>` : ""}`)}</tr></table>`;
  const who = [ev.band && ["Band", ev.band], sheet.choir && ["Choir", sheet.choir], sheet.otherSingers && ["Also singing", sheet.otherSingers], ev.dressCode && ["Dress code", ev.dressCode]].filter(Boolean) as [string, string][];
  const whoHtml = who.length ? `<div style="margin-top:12px;font-size:15px;line-height:1.6;">${who.map(([k, v]) => `<div><span style="color:${mute};">${e(k)}:</span> <strong>${e(v)}</strong></div>`).join("")}</div>` : "";
  const runHtml = sched.length ? label("Run of the night") + sched.map((r: Doc) => `<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td style="width:84px;padding:8px 0;border-bottom:1px solid ${rule};font-size:16px;font-weight:700;color:${navy};vertical-align:top;">${e(t12(r.time))}</td><td style="padding:8px 0;border-bottom:1px solid ${rule};font-size:16px;">${e(r.item || "")}</td></tr></table>`).join("") : "";
  const songsHtml = (sheet.songs || []).length ? label("Music — in order") + sheet.songs.map((r: Doc) => { const p = splitSong(r.song);
    return `<div style="padding:10px 0;border-bottom:1px solid ${rule};"><div style="font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:${mute};font-weight:700;">${e(r.moment || "")}</div><div style="font-size:18px;font-weight:700;line-height:1.3;margin-top:2px;white-space:pre-wrap;">${e(p.title)}</div>${p.version || p.how ? `<div style="font-size:14px;color:${mute};">${[p.version, p.how].filter(Boolean).map(e).join(" · ")}</div>` : ""}${p.notes.map((n) => `<div style="margin-top:6px;background:#FFF2D6;color:#7A4E08;font-size:14px;font-weight:600;padding:6px 10px;border-radius:6px;">${e(n)}</div>`).join("")}</div>`; }).join("") : "";
  const extras = ((ev.clientForm || {}).sections || []).flatMap((s: Doc) => s.rows || []).filter((r: Doc) => !r.placed);
  const yn = extras.filter((r: Doc) => ["Yes", "No", "Not sure"].includes(r.value)), rest = extras.filter((r: Doc) => !["Yes", "No", "Not sure"].includes(r.value));
  const tag = (r: Doc) => `<span style="display:inline-block;margin:0 6px 6px 0;padding:6px 12px;border-radius:999px;font-size:14px;font-weight:600;${r.value === "Yes" ? `background:${navy};color:#fff;` : r.value === "No" ? `background:#EEF0F3;color:${mute};text-decoration:line-through;` : "background:#FFF2D6;color:#7A4E08;"}">${e(r.label)}${r.value === "Yes" ? " ✓" : r.value === "No" ? "" : " ?"}</span>`;
  const extrasHtml = extras.length ? label("From the client's form") + (yn.length ? `<div>${yn.map(tag).join("")}</div>` : "") + rest.map((r: Doc) => `<div style="padding:8px 0;border-bottom:1px solid ${rule};font-size:15px;"><div style="font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:${mute};font-weight:700;">${e(r.label)}</div><div style="margin-top:2px;white-space:pre-wrap;">${/^https?:\/\//.test(r.value) ? `<a href="${e(r.value)}" style="color:${navy};font-weight:600;word-break:break-all;">${e(r.value)}</a>` : e(r.value)}</div></div>`).join("") : "";
  const notesHtml = sheet.text ? label("Notes") + `<p style="font-size:15px;white-space:pre-wrap;margin:0;line-height:1.55;">${e(sheet.text)}</p>` : "";
  const contactsHtml = (sheet.contacts || []).length ? label("Who to call") + sheet.contacts.map((c: Doc) => `<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td style="padding:10px 0;border-bottom:1px solid ${rule};"><strong style="font-size:16px;">${e(c.name)}</strong>${c.role ? `<div style="font-size:13px;color:${mute};">${e(c.role)}</div>` : ""}</td><td style="padding:10px 0;border-bottom:1px solid ${rule};text-align:right;">${c.phone ? `<a href="tel:${e(String(c.phone).replace(/[^\d+]/g, ""))}" style="font-size:17px;font-weight:700;color:${navy};text-decoration:none;">${e(c.phone)}</a>` : ""}</td></tr></table>`).join("") : "";
  return `<!doctype html><html><body style="margin:0;padding:20px;background:#F6F7F9;font-family:Archivo,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:${ink};">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;">
    <div style="padding:20px 24px 16px;border-bottom:1px solid ${rule};">${emailHeaderHtml(artistName)}
      <div style="font-size:11px;letter-spacing:.16em;color:${mute};font-weight:700;margin-top:6px;">GIG SHEET · ${e([ev.type, ev.clientName].filter(Boolean).join(" · ").toUpperCase())}</div></div>
    <div style="padding:6px 24px 24px;line-height:1.45;">${facts}${whoHtml}${runHtml}${songsHtml}${extrasHtml}${notesHtml}${contactsHtml}
      <p style="margin:22px 0 0;font-size:13px;">The latest version is always in the app: <a href="${appUrl()}" style="color:${navy};">${appUrl().replace(/^https?:\/\//, "")}</a></p>
    </div>
    <div style="padding:12px 24px;border-top:1px solid ${rule};font-size:11px;color:${mute};">ASP Management &middot; office@aspmgmt.com${phone ? ` &middot; ${e(phone)}` : ""}</div>
  </div></body></html>`;
}
