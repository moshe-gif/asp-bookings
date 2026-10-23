// Post-event thank-you (owner 2026-10-23): a REVIEWED DRAFT, never automatic. The office opens
// "Send thank-you" on a past gig, edits the wording, sees the exact email (preview: true renders it,
// sends nothing), and only their click sends it -- one gig, one recipient, per call. Admin-only; there is
// no cron path (no x-cron-secret), and no schedule, toggle or batch anywhere calls this.
//
//   POST { gig: "EV-5020", to, subject, text, preview?: true }
//   text: the body as typed, paragraphs separated by a blank line; the first paragraph is the greeting.
//
// Once per gig: the client_followups row (kind post_event_thanks, migration 0065) is claimed BEFORE the
// send and marked failed if the send fails, so a double click can't send twice and a failure can be
// retried. In TEST MODE (EMAIL_LIVE unset) the email goes to the test inbox and the gig is NOT marked
// thanked -- the real client can still be thanked after go-live.
//
// Deploy with JWT verification ON.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";
import { emailTestMode, sendRelayEmail } from "../_shared/mail.ts";
import { emailHtml, esc } from "../_shared/clientmail.ts";
import { officePhone } from "../_shared/payblock.ts";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_TEXT = 5000;
const localToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;

  const body = await readJson<{ gig?: string; to?: string; subject?: string; text?: string; preview?: boolean }>(req);
  if (!body) return json({ ok: false, error: "bad json" }, 400);
  const gig = String(body.gig || ""), to = String(body.to || "").trim(), subject = String(body.subject || "").trim(), text = String(body.text || "").trim();
  if (!/^EV-\d+$/.test(gig)) return json({ ok: false, error: "which gig?" }, 400);
  if (!EMAIL_RE.test(to)) return json({ ok: false, error: "Enter one valid email address." }, 400);
  if (!subject || subject.length > 200) return json({ ok: false, error: "Enter a subject (200 characters at most)." }, 400);
  if (!text || text.length > MAX_TEXT) return json({ ok: false, error: `Write the message (${MAX_TEXT} characters at most).` }, 400);

  const sb = serviceClient();
  const { data: row } = await sb.from("events").select("app_doc").eq("legacy_id", gig).maybeSingle();
  const ev = row?.app_doc;
  if (!ev) return json({ ok: false, error: "gig not found" }, 404);
  if (!(String(ev.date || "") < localToday())) return json({ ok: false, error: "This gig hasn't happened yet." }, 409);
  if (!["booked", "paid"].includes(ev.status)) return json({ ok: false, error: "Only a booked or paid gig gets a thank-you." }, 409);

  const [greeting, ...rest] = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const html = emailHtml({ greeting, lines: rest.map((p) => esc(p).replace(/\n/g, "<br/>")), signoff: "Warm regards,", phone: (await officePhone(sb)) || "" });
  if (body.preview) return json({ ok: true, preview: true, html });

  const test = emailTestMode();
  const real = !test.on; // test mode never marks a gig thanked, even sent to an allow-listed staff address
  let claimId: string | null = null;
  if (real) {
    const { data: claim, error } = await sb.from("client_followups")
      .insert({ event_legacy_id: gig, kind: "post_event_thanks", sent_to: to, ok: true }).select("id").single();
    if (error) return json({ ok: false, error: error.code === "23505" ? "This gig was already thanked." : "Could not record the send: " + error.message }, error.code === "23505" ? 409 : 500);
    claimId = claim.id;
  }
  let sent: { ok: boolean; error?: string; brandKey?: string; id?: string };
  try { sent = await sendRelayEmail(sb, { to, subject, html }); }
  catch (err) { sent = { ok: false, error: "send failed: " + String((err as Error)?.message || err) }; } // the claim is released below
  if (claimId) {
    await sb.from("client_followups").update(sent.ok ? { provider_id: sent.id || null } : { ok: false, error: (sent.error || "send failed").slice(0, 500) }).eq("id", claimId);
  }
  if (!sent.ok) return json({ ok: false, error: sent.error || "send failed" }, 502);
  const { error: logErr } = await sb.from("email_sends").insert({ sent_by: auth.user.id, sent_to: to, subject: subject.slice(0, 300), brand_key: sent.brandKey });
  if (logErr) console.error("send-thanks: sent, but not recorded in email_sends", logErr.message);
  return json({ ok: true, testMode: !real, testTo: real ? null : test.to });
});
