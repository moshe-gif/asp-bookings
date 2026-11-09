// The client's gig-info form (owner 2026-11-05): after the deposit, the client gets a link to tell us the
// times, song choices, chuppah list etc. One definition per kind of gig lives HERE and nowhere else: the form
// page (frontend/form/) draws whatever the gig-form function sends it, and the answers are poured into the
// gig's Gig Info sheet (startTime, run of the night, songs, contacts) by applyAnswers() below.
// Concerts get no form. A comedian's gigs (Dovie) get a short audience form -- a first draft, the owner
// said "we have to figure out what we should do for dovie gigs".
import { appUrl, emailHeaderHtml, viaAsp } from "./config.ts";
import { sendRelayEmail } from "./mail.ts";
import { sendTemplate, templateStatus360, waNumber } from "./whatsapp.ts";

// deno-lint-ignore no-explicit-any
type Sb = any;
// deno-lint-ignore no-explicit-any
type Doc = Record<string, any>;

// t: text | textarea | time | tel | email | yesno.  to (where the answer lands on the gig):
//   start                the artist's start time (Gig Info "Artist starts")
//   sched:<label>        a line in the run of the night, at that time
//   song                 a song, with the field's label as the moment
//   c:<role>:<part>      a contact (part = name | phone | email)
//   band                 the band (weddings)
//   singers              "other singers"
export type Field = { k: string; label: string; t: string; ph?: string; hint?: string; to?: string; half?: boolean; show?: string };
export type Section = { title: string; intro?: string; fields: Field[] };
export type FormDef = { kind: string; title: string; intro: string; sections: Section[] };

const SONG_PH = "Song – singer (or leave blank)";
const contactFields = (role: string, nameLabel: string, phoneLabel: string): Field[] => [
  { k: `${role}Name`, label: nameLabel, t: "text", to: `c:${role}:name`, half: true },
  { k: `${role}Phone`, label: phoneLabel, t: "tel", to: `c:${role}:phone`, half: true },
];
const CONTACT_ROLES: Record<string, string> = {
  planner: "Party planner", dayof: "Contact on the day", chosson: "Chosson", kallah: "Kallah",
  father: "Father", mother: "Mother", host: "Host",
};
const extras = (more: Field[] = []): Section => ({ title: "Anything else", fields: [
  ...more,
  { k: "notes", label: "Anything else we should know", t: "textarea", ph: "Special requests, surprises, things to avoid…" },
] });
const contacts = (): Section => ({ title: "Who to call on the day", intro: "So the singer and band can reach the right person at the event.",
  fields: [...contactFields("dayof", "Contact on the day", "Their phone"), ...contactFields("planner", "Party planner (if any)", "Planner phone")] });

// The wedding form follows the office's own prep sheet and how clients actually send it (owner 2026-11-09: "the
// wedding form is terrible, it does not reflect the ones i sent you"): names, band, who sings; the times; then the
// chuppah IN ORDER, each part a "song" field (the song, whose version, sung / instrumental / a track they send, and a
// note for the singer); then the reception.
const song = (k: string, label: string, ph = "Song"): Field => ({ k, label, t: "song", ph, to: "song" });
const WEDDING: FormDef = { kind: "wedding", title: "Wedding prep form", intro: "Everything the singer and band need for the chuppah and the wedding. Fill in what you know now; you can come back to this same link to add or change anything.", sections: [
  { title: "The wedding", fields: [
    { k: "familyNames", label: "Family names", t: "text", ph: "e.g. Groman – Kohn" },
    { k: "chossonFirst", label: "Chosson's first name", t: "text", half: true }, { k: "kallahFirst", label: "Kallah's first name", t: "text", half: true },
    { k: "chossonLast", label: "Chosson's last name", t: "text", half: true }, { k: "kallahLast", label: "Kallah's last name", t: "text", half: true },
    { k: "band", label: "Band", t: "text", ph: "Who is playing", to: "band", half: true },
    // Our singer sings both unless the client ticks the box (owner 2026-11-09: "should assume the singer, and a check box if
    // there is someone else").
    { k: "chuppahOther", label: "Someone else is singing at the chuppah too", t: "check" },
    { k: "chuppahSinger", label: "Who else sings at the chuppah", t: "text", ph: "e.g. a friend of the chosson", to: "singers", show: "chuppahOther" },
    { k: "weddingOther", label: "Someone else is singing at the wedding too", t: "check" },
    { k: "weddingSinger", label: "Who else sings at the wedding", t: "text", ph: "Name, and which songs", to: "singers", show: "weddingOther" },
  ] },
  { title: "Times", fields: [
    { k: "inviteTime", label: "Invite time / Kabbalas Panim", t: "time", to: "sched:Kabbalas Panim", half: true },
    { k: "roomOpens", label: "Room opens", t: "time", to: "sched:Room opens", half: true },
    { k: "musicStart", label: "Band starts", t: "time", to: "start", half: true },
    { k: "chuppahTime", label: "Chuppah", t: "time", to: "sched:Chuppah", half: true },
  ] },
  { title: "The chuppah, in order", intro: "For each part: the song, whose version, and whether it's sung, instrumental or a track you'll send. Skip any part you don't need.", fields: [
    song("sOpening", "1. Chuppah opening", "Usually instrumental"),
    song("sPrelude", "2. Prelude"),
    { k: "announcement", label: "3. Announcement after the prelude", t: "text", ph: "What to announce, if anything" },
    song("sKids", "4. Little kids walking down"),
    song("sChosson", "5. Chosson walking down"),
    song("sMiAdir", "6. Mi Adir"),
    { k: "familyProcession", label: "7. Family procession", t: "textarea", ph: "Names in order, and how many sets walk to each song", hint: "Please list the family processions fully, with names and how many sets walk by each song." },
    song("sFlower", "8. Flower girls", "Usually instrumental"),
    song("sKallah", "9. Kallah walking down"),
    song("sMiBon", "10. Mi Bon Siach (circling)"),
    song("sAfterCircling", "11. After circling", "e.g. Is Bonim"),
    song("sMedley", "12. Chuppah medley"),
    song("sImEshkachech", "13. Im Eshkachech (or Shir Hamaalos)"),
    { k: "sAfterBrachos", label: "14. Songs after the brachos", t: "textarea", ph: "One per line: song – whose version", to: "song" },
    { k: "sEnd", label: "15. End of chuppah", t: "text", ph: "e.g. Od Yishama — continue 5 extra minutes", to: "song" },
  ] },
  { title: "Reception", fields: [
    song("sIntro", "Intro (couple's entrance)", "Song, or 'we'll send the track'"),
    { k: "introAnnounce", label: "Name announcement — exactly how to say it", t: "text", ph: "e.g. Motty & Chay" },
    { k: "dinnerMusic", label: "Dinner music requests", t: "textarea", to: "song" },
    { k: "danceRequests", label: "Dance requests", t: "textarea", ph: "3rd dance, Israeli, Chassidish, a medley…", to: "song" },
    { k: "flashMob", label: "Flash mob", t: "yesno", half: true },
    { k: "keitzad", label: "Keitzad Merakdim", t: "yesno", half: true },
    { k: "flashMobDetails", label: "Flash mob song and when", t: "text", ph: "Song, and when in the evening", show: "flashMob" },
    { k: "flashMobLink", label: "Link to the flash mob song or video", t: "url", ph: "Paste a YouTube, Drive or WeTransfer link", show: "flashMob" },
    { k: "kumzitz", label: "Kumzitz", t: "yesno", half: true },
    { k: "mezinka", label: "Mezinka", t: "yesno", half: true },
    { k: "mitzvaTantz", label: "Mitzva tantz", t: "yesno", half: true },
    { k: "guestSingers", label: "Guest singers", t: "text", ph: "Anyone else singing a song?", to: "singers", half: true },
    { k: "announcements", label: "Special announcements", t: "textarea" },
  ] },
  contacts(),
  extras(),
] };

const BAR_MITZVAH: FormDef = { kind: "bar_mitzvah", title: "Bar Mitzvah details", intro: "Tell us about the simcha so the music is just right. You can come back to this same link to add or change anything.", sections: [
  { title: "The Bar Mitzvah", fields: [
    { k: "boyName", label: "Bar Mitzvah boy's name", t: "text" },
    ...contactFields("father", "Father's name", "Father's phone"), ...contactFields("mother", "Mother's name", "Mother's phone"),
  ] },
  { title: "Times", fields: [
    { k: "startTime", label: "Event starts", t: "time", to: "sched:Event starts", half: true },
    { k: "musicStart", label: "Music starts", t: "time", to: "start", half: true },
    { k: "band", label: "Band", t: "text", ph: "Who is playing", to: "band" },
    { k: "program", label: "Run of the evening", t: "textarea", ph: "Speeches, candle lighting, dancing…" },
  ] },
  { title: "Music", fields: [
    { k: "intro", label: "Entrance song and name announcement", t: "textarea", to: "song" },
    { k: "special", label: "Special songs", t: "textarea", ph: "For grandparents, candle lighting, a family song…", to: "song" },
    { k: "danceRequests", label: "Dance requests", t: "textarea", to: "song" },
    { k: "flashMob", label: "Flash mob", t: "yesno", half: true },
    { k: "guestSingers", label: "Guest singers", t: "text", to: "singers", half: true },
    { k: "announcements", label: "Special announcements", t: "textarea" },
  ] },
  contacts(),
  extras(),
] };

const SHEVA_BRACHOS: FormDef = { kind: "sheva_brachos", title: "Sheva Brachos details", intro: "A few details so the music is just right. You can come back to this same link to add or change anything.", sections: [
  { title: "The couple", fields: [
    { k: "couple", label: "Chosson and kallah's names", t: "text" },
    { k: "hostName", label: "Hosted by", t: "text", to: "c:host:name", half: true }, { k: "hostPhone", label: "Host phone", t: "tel", to: "c:host:phone", half: true },
  ] },
  { title: "Times", fields: [
    { k: "startTime", label: "Event starts", t: "time", to: "sched:Event starts", half: true },
    { k: "musicStart", label: "Music starts", t: "time", to: "start", half: true },
  ] },
  { title: "Music", fields: [
    { k: "songRequests", label: "Song requests", t: "textarea", to: "song" },
    { k: "guestSingers", label: "Guest singers", t: "text", to: "singers" },
  ] },
  contacts(),
  extras(),
] };

const EVENT: FormDef = { kind: "event", title: "Event details", intro: "A few details so the performance is just right. You can come back to this same link to add or change anything.", sections: [
  { title: "The event", fields: [
    { k: "honoree", label: "Organization / who the event is for", t: "text" },
    { k: "startTime", label: "Event starts", t: "time", to: "sched:Event starts", half: true },
    { k: "musicStart", label: "Artist goes on", t: "time", to: "start", half: true },
    { k: "program", label: "Run of the evening", t: "textarea", ph: "Speeches, dinner, when the artist performs…" },
    { k: "sound", label: "Is there a sound system / band at the venue?", t: "text", ph: "Who is providing sound" },
  ] },
  { title: "Music", fields: [
    { k: "songRequests", label: "Song requests", t: "textarea", to: "song" },
    { k: "guestSingers", label: "Guest singers", t: "text", to: "singers" },
    { k: "announcements", label: "Special announcements", t: "textarea" },
  ] },
  contacts(),
  extras(),
] };

const COMEDIAN: FormDef = { kind: "comedian", title: "Show details", intro: "A few details so the show fits your crowd. You can come back to this same link to add or change anything.", sections: [
  { title: "The show", fields: [
    { k: "honoree", label: "Organization / who the event is for", t: "text" },
    { k: "startTime", label: "Event starts", t: "time", to: "sched:Event starts", half: true },
    { k: "musicStart", label: "Show starts", t: "time", to: "start", half: true },
    { k: "setLength", label: "How long should the set be?", t: "text", ph: "e.g. 45 minutes", half: true },
    { k: "crowdSize", label: "About how many people?", t: "text", half: true },
    { k: "audience", label: "Who's in the crowd?", t: "textarea", ph: "Men / women / mixed, ages, community, kids?" },
    { k: "sound", label: "Mic and stage", t: "text", ph: "Is there a mic, stage, sound person?" },
  ] },
  { title: "Make it personal", fields: [
    { k: "mention", label: "Names, inside jokes or things to mention", t: "textarea" },
    { k: "avoid", label: "Anything to avoid", t: "textarea" },
  ] },
  contacts(),
  extras(),
] };

export const GIG_FORMS: Record<string, FormDef> = { wedding: WEDDING, bar_mitzvah: BAR_MITZVAH, sheva_brachos: SHEVA_BRACHOS, event: EVENT, comedian: COMEDIAN };

// Which form a gig gets (null = none: concerts). artistRole: the main artist's role ('Comedian' for Dovie).
export function formKindFor(ev: Doc, artistRole?: string | null): string | null {
  if (ev.type === "Concert") return null;
  if (/comedian/i.test(String(artistRole || ""))) return "comedian";
  if (ev.type === "Wedding") return "wedding";
  if (ev.type === "Bar Mitzvah") return "bar_mitzvah";
  if (ev.type === "Sheva Brachos") return "sheva_brachos";
  return "event";
}

// Clean what the client sent: only the form's own keys, strings, capped.
export function cleanAnswers(def: FormDef, raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  const src = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  for (const s of def.sections) for (const f of s.fields) {
    let v = typeof src[f.k] === "string" ? String(src[f.k]).replace(/\r\n/g, "\n").trim() : "";
    if (f.t === "time" && v && !/^\d{2}:\d{2}$/.test(v)) v = "";
    if (f.t === "yesno" && v && !["Yes", "No", "Not sure"].includes(v)) v = "";
    if (f.t === "check" && v !== "Yes") v = "";
    if (f.t === "url" && v && !/^https?:\/\/\S+$/i.test(v)) v = /^[\w.-]+\.[a-z]{2,}\/?\S*$/i.test(v) ? "https://" + v : "";
    if (f.show && src[f.show] !== "Yes") v = "";   // only when its box is ticked
    v = v.slice(0, f.t === "textarea" ? 4000 : 300);
    if (v) out[f.k] = v;
    if (f.t === "song") for (const part of SONG_PARTS) {
      let p = typeof src[f.k + part] === "string" ? String(src[f.k + part]).trim().slice(0, 300) : "";
      if (part === "~how" && p && !SONG_HOW.includes(p)) p = "";
      if (p) out[f.k + part] = p;
    }
  }
  return out;
}

// A "song" field's other parts: whose version, how (sung / instrumental / a track the client sends), a note.
const SONG_PARTS = ["~by", "~how", "~note"];
const SONG_HOW = ["Sung", "Instrumental", "We'll send a track"];
// One line for a song answer: "Aheim — Beri Weber · Sung · modulate for the high part".
export function answerValue(f: Field, a: Record<string, string>): string {
  if (f.t !== "song") return a[f.k] || "";
  const head = [a[f.k], a[f.k + "~by"]].filter(Boolean).join(" — ");
  return [head, a[f.k + "~how"], a[f.k + "~note"]].filter(Boolean).join(" · ");
}
// Name halves that become a contact's name (applyAnswers).
const NAME_PARTS = new Set(["chossonFirst", "chossonLast", "kallahFirst", "kallahLast"]);
// The answers as labelled sections (placed: it also landed in Gig Info's songs / times / contacts / singers) (what the app shows under Gig Info → Client form).
export function answerSections(def: FormDef, a: Record<string, string>) {
  return def.sections.map((s) => ({ title: s.title, rows: s.fields.filter((f) => answerValue(f, a)).map((f) => ({ label: f.label, value: answerValue(f, a), ...(f.to || NAME_PARTS.has(f.k) ? { placed: true } : {}) })) }))
    .filter((s) => s.rows.length);
}

// Pour the answers into the gig: Gig Info's artist start time, run of the night, songs, contacts, other singers,
// and the band; the full answers are kept on ev.clientForm. What the form put in last time is taken out first,
// so the client can come back and change an answer without duplicates. Office-typed lines are never touched.
export function applyAnswers(ev: Doc, def: FormDef, a: Record<string, string>, at: string): Doc {
  const prev = (ev.clientForm && ev.clientForm.applied) || {};
  const sheet: Doc = { text: "", contacts: [], choir: "", otherSingers: "", startTime: "", schedule: [], songs: [], ...(ev.gigInfoSheet || {}) };
  const same = (x: unknown, y: unknown) => JSON.stringify(x) === JSON.stringify(y);
  const drop = (list: Doc[], old: Doc[]) => (list || []).filter((r) => !(old || []).some((o) => same({ ...r, id: undefined }, { ...o, id: undefined })));
  const fields = def.sections.flatMap((s) => s.fields);

  const schedule = fields.filter((f) => f.to?.startsWith("sched:") && a[f.k]).map((f) => ({ time: a[f.k], item: f.to!.slice(6) }));
  const songs = fields.filter((f) => f.to === "song" && answerValue(f, a)).map((f) => ({ moment: f.label.replace(/^\d+\.\s*/, ""), song: answerValue(f, a) }));
  const byRole: Record<string, Doc> = {};
  for (const f of fields) {
    const m = /^c:(\w+):(\w+)$/.exec(f.to || "");
    if (m && a[f.k]) (byRole[m[1]] ||= { name: "", phone: "", email: "" })[m[2]] = a[f.k];
  }
  if (a.chossonFirst || a.chossonLast) (byRole.chosson ||= { name: "", phone: "", email: "" }).name = `${a.chossonFirst || ""} ${a.chossonLast || ""}`.trim();
  if (a.kallahFirst || a.kallahLast) (byRole.kallah ||= { name: "", phone: "", email: "" }).name = `${a.kallahFirst || ""} ${a.kallahLast || ""}`.trim();
  const contacts = Object.entries(byRole).map(([role, c]) => ({ id: `GC-form-${role}`, name: c.name || CONTACT_ROLES[role] || role, role: CONTACT_ROLES[role] || role, phone: c.phone || "", email: c.email || "" }));
  const singers = fields.filter((f) => f.to === "singers" && a[f.k]).map((f) => `${f.label}: ${a[f.k]}`).join("; ");
  const startF = fields.find((f) => f.to === "start");
  const start = startF ? a[startF.k] || "" : "";

  sheet.schedule = [...drop(sheet.schedule, prev.schedule), ...schedule].sort((x, y) => String(x.time || "99").localeCompare(String(y.time || "99")));
  sheet.songs = [...drop(sheet.songs, prev.songs), ...songs];
  sheet.contacts = [...(sheet.contacts || []).filter((c: Doc) => !String(c.id || "").startsWith("GC-form-")), ...contacts];
  if (start && (!sheet.startTime || sheet.startTime === prev.startTime)) sheet.startTime = start;
  if (singers && (!sheet.otherSingers || sheet.otherSingers === prev.otherSingers)) sheet.otherSingers = singers;
  sheet.updatedAt = at.slice(0, 10);

  const bandF = fields.find((f) => f.to === "band");
  const band = bandF ? a[bandF.k] || "" : "";
  const next: Doc = { ...ev, gigInfoSheet: sheet,
    clientForm: { kind: def.kind, submittedAt: at, answers: a, sections: answerSections(def, a),
      applied: { schedule, songs, startTime: sheet.startTime === start ? start : prev.startTime || "", otherSingers: sheet.otherSingers === singers ? singers : prev.otherSingers || "" } } };
  if (band && (!ev.band || ev.band === prev.band)) { next.band = band; next.clientForm.applied.band = band; }
  return next;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export { sha256Hex as gigFormHash };

// A new link to a gig's form (links never replace each other; any open link edits the same answers).
export async function mintGigFormLink(sb: Sb, gig: string, by?: string | null): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const { error } = await sb.from("gig_form_links").insert({ token_hash: await sha256Hex(token), event_legacy_id: gig, created_by: by || null });
  if (error) return { ok: false, error: error.message };
  return { ok: true, url: `${appUrl()}/form/#${token}` };
}

const escH = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

// Send a gig's form link to the client: email and/or WhatsApp (one new link for both). The WhatsApp waits until
// Meta approves its template (held: nothing minted, the caller tries again later). Test mode applies (mail.ts,
// whatsapp.ts). Returns what happened per channel; the caller logs it.
export async function sendGigForm(sb: Sb, o: { gig: string; ev: Doc; singers: string; when: string; email: boolean; whatsapp: boolean; by?: string | null; reminder?: boolean }) {
  const first = String(o.ev.clientName || "").trim().split(/\s+/)[0] || "there";
  const to = String(o.ev.clientEmail || "").trim();
  const waTo = waNumber(o.ev.clientPhone || "").length >= 10 ? String(o.ev.clientPhone) : "";
  const out: { email?: { ok: boolean; error?: string; to: string }; whatsapp?: { ok: boolean; error?: string; held?: boolean; to: string }; url?: string } = {};
  const wantEmail = o.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to);
  let wantWa = o.whatsapp && !!waTo;
  if (wantWa && (await templateStatus360().catch(() => ({} as Record<string, string>)))["asp_gig_form"] !== "approved") {
    out.whatsapp = { ok: false, held: true, error: "waiting for Meta to approve the message template", to: waTo };
    wantWa = false;
  }
  if (!wantEmail && !wantWa) return out;
  const link = await mintGigFormLink(sb, o.gig, o.by);
  if (!link.ok) {
    if (wantEmail) out.email = { ok: false, error: link.error, to };
    if (wantWa) out.whatsapp = { ok: false, error: link.error, to: waTo };
    return out;
  }
  out.url = link.url;
  if (wantEmail) {
    const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#F5F4EF;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17171A;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;">
    <div style="padding:20px 24px 16px;border-bottom:1px solid #E3E3E8;">${emailHeaderHtml(o.singers === "your event" ? "" : o.singers)}</div>
    <div style="padding:24px;font-size:14px;line-height:1.6;">
      <p style="margin:0 0 12px;">Hi ${escH(first)},</p>
      ${o.reminder
        ? `<p style="margin:0 0 12px;">Your event with <strong>${escH(o.singers)}</strong> on <strong>${escH(o.when)}</strong> is coming up, and we don't have the event details yet.</p>
      <p style="margin:0 0 12px;">Please fill in the times, your song choices and who to call on the day, so everything is ready. Fill in what you know; you can come back to the same link to add or change things.</p>`
        : `<p style="margin:0 0 12px;">Thank you, your date is booked: <strong>${escH(o.singers)}</strong> on <strong>${escH(o.when)}</strong>.</p>
      <p style="margin:0 0 12px;">To get everything ready, please fill in the event details: the times, your song choices and who to call on the day. Fill in what you know now; you can come back to the same link anytime to add or change things.</p>`}
      <p style="margin:18px 0;"><a href="${escH(link.url)}" style="display:inline-block;background:#4C6FA5;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;">Fill in the details</a></p>
      <p style="margin:18px 0 0;">Thank you,<br/>ASP Management</p>
    </div>
    <div style="padding:12px 24px;border-top:1px solid #E3E3E8;font-size:11px;color:#6B6B72;">ASP Management &middot; office@aspmgmt.com</div>
  </div></body></html>`;
    const sent = await sendRelayEmail(sb, { to, subject: viaAsp(o.singers === "your event" ? "" : o.singers, `${o.reminder ? "Reminder: your event details" : "Your event details"}, ${o.when}`), html, brand: "asp" });
    out.email = { ok: sent.ok, error: sent.error, to };
  }
  if (wantWa) {
    const wa = await sendTemplate(waTo, "gig_form", [first, o.singers, o.when, link.url], o.by || undefined);
    out.whatsapp = { ok: wa.ok, error: wa.error, held: !wa.ok && /waiting for Meta/.test(String(wa.error)), to: waTo };
  }
  return out;
}
