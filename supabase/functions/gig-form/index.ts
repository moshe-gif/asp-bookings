// The client's gig-info form (0081, owner 2026-11-05). app.aspmgmt.com/form/#<token> calls this to show the form
// and save the answers; no login -- the client isn't an ASP user. The token is the boundary, as in
// contract-sign: 32 random bytes, only its SHA-256 stored, sent in the POST body.
//
//   POST { action: "view", token }              -> the form (definition from _shared/gigform.ts), the gig's basics,
//                                                  and the answers saved so far
//   POST { action: "submit", token, answers }   -> saves them on the gig (ev.clientForm) and pours them into its
//                                                  Gig Info sheet; tells the office (email + WhatsApp alert)
// Admin only (signed-in office):
//   POST { action: "link", gig }                -> a new link to copy
//   POST { action: "send", gig }                -> email + WhatsApp the link to the client now
//
// Deployed with JWT verification OFF (the client has no session); the admin actions check the caller themselves.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";
import { brandFor } from "../_shared/config.ts";
import { sendRelayEmail } from "../_shared/mail.ts";
import { sendTemplate, waNumber } from "../_shared/whatsapp.ts";
import { GIG_FORMS, answerSections, applyAnswers, cleanAnswers, formKindFor, gigFormHash, mintGigFormLink, sendGigForm } from "../_shared/gigform.ts";

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const GIG_RE = /^EV-[A-Za-z0-9-]{1,40}$/;
const MAX_SUBMITS = 200;
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const fmtDate = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const nyToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());

// deno-lint-ignore no-explicit-any
async function gigWithArtists(sb: any, gig: string) {
  const { data: e } = await sb.from("events").select("legacy_id, date, app_doc").eq("legacy_id", gig).maybeSingle();
  if (!e?.app_doc) return null;
  const ev: Row = e.app_doc;
  const refs = [ev.artistId, ...((ev.additionalArtists || []).map((x: Row) => x?.artistId))].filter(Boolean).map(String);
  const { data: artists } = await sb.from("artists").select("id, legacy_id, name, role");
  const find = (r: string) => (artists || []).find((a: Row) => a.legacy_id === r || a.id === r);
  const main = find(String(ev.artistId || ""));
  const names = refs.map((r) => find(r)?.name).filter(Boolean).join(" & ");
  return { e, ev, kind: formKindFor(ev, main?.role), singers: names || "your event", when: fmtDate(String(e.date)) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  const body = await readJson<Row>(req) || {};
  const sb = serviceClient();

  // ---- office side ----
  if (body.action === "link" || body.action === "send") {
    const auth = await requireAdmin(req, json);
    if (auth instanceof Response) return auth;
    const gig = String(body.gig || "");
    if (!GIG_RE.test(gig)) return json({ ok: false, error: "bad gig" }, 400);
    const g = await gigWithArtists(sb, gig);
    if (!g) return json({ ok: false, error: "gig not found" }, 404);
    if (!g.kind) return json({ ok: false, error: "Concerts don't get a details form." }, 400);
    if (body.action === "link") {
      const link = await mintGigFormLink(sb, gig, auth.user.id);
      return link.ok ? json({ ok: true, url: link.url }) : json({ ok: false, error: link.error }, 500);
    }
    const out = await sendGigForm(sb, { gig, ev: g.ev, singers: g.singers, when: g.when, email: true, whatsapp: true, by: auth.user.id });
    if (out.email) await sb.from("client_followups").insert({ event_legacy_id: gig, kind: "gig_form", sent_to: out.email.to, ok: out.email.ok, error: out.email.ok ? null : out.email.error });
    if (out.whatsapp && !out.whatsapp.held) await sb.from("client_followups").insert({ event_legacy_id: gig, kind: "gig_form_wa", sent_to: "whatsapp:" + waNumber(out.whatsapp.to), ok: out.whatsapp.ok, error: out.whatsapp.ok ? null : out.whatsapp.error });
    return json({ ok: true, email: out.email || null, whatsapp: out.whatsapp || null });
  }

  // ---- client side ----
  if (typeof body.token !== "string" || !TOKEN_RE.test(body.token)) return json({ ok: false, error: "not_found" }, 404);
  const { data: link, error } = await sb.from("gig_form_links").select("id, event_legacy_id, expires_at, revoked_at, first_viewed_at, submit_count")
    .eq("token_hash", await gigFormHash(body.token)).maybeSingle();
  if (error) { console.error("gig-form link", error.message); return json({ ok: false, error: "server" }, 500); }
  if (!link || link.revoked_at) return json({ ok: false, error: "not_found" }, 404);
  if (new Date(link.expires_at) <= new Date()) return json({ ok: false, error: "expired" }, 410);
  const g = await gigWithArtists(sb, link.event_legacy_id);
  if (!g || !g.kind) return json({ ok: false, error: "not_found" }, 404);
  const def = GIG_FORMS[g.kind];
  // After the gig, the answers can still be read but not changed.
  const closed = String(g.e.date) < nyToday();

  if (body.action === "view") {
    if (!link.first_viewed_at) await sb.from("gig_form_links").update({ first_viewed_at: new Date().toISOString() }).eq("id", link.id);
    const ev = g.ev;
    return json({ ok: true, form: def, closed,
      gig: { when: g.when, singers: g.singers, venue: [ev.venue, ev.city].filter(Boolean).join(", "), clientFirst: String(ev.clientName || "").trim().split(/\s+/)[0] || "", type: ev.type || "" },
      answers: ev.clientForm?.kind === def.kind ? ev.clientForm.answers || {} : {}, submittedAt: ev.clientForm?.submittedAt || null });
  }

  if (body.action === "submit") {
    if (closed) return json({ ok: false, error: "closed" }, 410);
    if ((link.submit_count || 0) >= MAX_SUBMITS) return json({ ok: false, error: "too_many" }, 429);
    const answers = cleanAnswers(def, body.answers);
    const at = new Date().toISOString();
    const first = !g.ev.clientForm?.submittedAt;
    const next = applyAnswers(g.ev, def, answers, at);
    next.log = [...(Array.isArray(g.ev.log) ? g.ev.log : []), { ts: at, type: "success", text: first ? "The client filled in the event details form." : "The client updated the event details form." }];
    const { error: upErr } = await sb.from("events").update({ app_doc: next }).eq("legacy_id", g.e.legacy_id);
    if (upErr) { console.error("gig-form save", upErr.message); return json({ ok: false, error: "server" }, 500); }
    await sb.from("gig_form_links").update({ submitted_at: at, submit_count: (link.submit_count || 0) + 1 }).eq("id", link.id);

    // Tell the office (best effort; the answers are saved).
    try {
      const who = g.ev.clientName || "The client";
      const brand = await brandFor(sb, "asp");
      if (brand.replyTo) {
        const rows = answerSections(def, answers).map((s) => `<h3 style="font-size:13px;margin:16px 0 6px;text-transform:uppercase;letter-spacing:.06em;color:#67676D;">${esc(s.title)}</h3>` +
          s.rows.map((r) => `<div style="margin:0 0 6px;"><span style="color:#67676D;">${esc(r.label)}:</span> <strong style="white-space:pre-wrap;">${esc(r.value)}</strong></div>`).join("")).join("");
        await sendRelayEmail(sb, { to: brand.replyTo, brand: "asp", subject: `${first ? "Event details in" : "Event details updated"}: ${who} — ${g.when}`,
          html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14px;line-height:1.5;color:#17171A;max-width:640px;"><p>${esc(who)} ${first ? "filled in" : "updated"} the event details for <strong>${esc(g.singers)}</strong> on <strong>${esc(g.when)}</strong> (${esc(g.e.legacy_id)}). It's in the app under Gig Info.</p>${rows}</div>` });
      }
      const { data: orgRow } = await sb.from("app_records").select("app_doc").eq("collection", "settings").eq("legacy_id", "org").maybeSingle();
      const officeTo = String(orgRow?.app_doc?.value?.alertsWhatsApp || "");
      if (first && waNumber(officeTo).length >= 10) await sendTemplate(officeTo, "office_alert", [`${who} filled in the event details for ${g.singers} on ${g.when}.`]);
    } catch (err) { console.error("gig-form notice", String(err)); }
    return json({ ok: true, submittedAt: at });
  }

  return json({ ok: false, error: "unknown action" }, 400);
});
