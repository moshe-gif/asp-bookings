// Inbox watch (owner 2026-10-15): every 10 minutes (pg_cron) read new mail in the office Gmail
// (read-only), have Claude classify each message and match it to a gig, and record it in inbox_items
// (0062) for the app's Inbox list. Never sends, deletes or changes anything in Gmail, and never changes a
// gig: the office approves each suggestion in the app. Payment notices only ever point at Verify Deposit.
//
// Auth: x-cron-secret = CRON_SECRET (the schedule) or an admin (manual "Check now").
// Secrets: ANTHROPIC_API_KEY, GMAIL_CLIENT_ID/SECRET (token refresh, via _shared/mail.ts).
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";
import { gmailSender } from "../_shared/mail.ts";
// Pinned here, not in _shared/deps.ts, so only the functions that call Claude load the SDK.
import Anthropic from "npm:@anthropic-ai/sdk@0.130.0";

const MAX_PER_RUN = 20;
const FIRST_RUN_DAYS = 2;
const MAX_BODY = 8000;
const MAX_ATTACH_BYTES = 3_000_000;
const ATTACH_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";

const str = (d: string) => ({ type: "string", description: d });
const schema = {
  type: "object", additionalProperties: false,
  required: ["kind", "summary", "event_legacy_id", "match_note", "extracted_json"],
  properties: {
    kind: { type: "string", enum: ["travel_confirmation", "booking_inquiry", "payment_notice", "gig_info", "client_reply", "other"],
      description: "travel_confirmation = flight/hotel/car booking; booking_inquiry = someone asking to book an artist; payment_notice = money received (Zelle, bank, Stripe); gig_info = band/planner details for a gig (lineup, times, songs); client_reply = a client writing about an existing booking; other = anything else (newsletters, spam, internal)" },
    summary: str("One short sentence for the office: what this email is and what to do"),
    event_legacy_id: str("The matching gig's id from the list (e.g. EV-1063), or empty when none clearly matches"),
    match_note: str("Why it matches that gig (client, date, artist), or what you looked for; short"),
    extracted_json: str("A JSON object with the details: travel_confirmation -> {flights:[{passenger,airline,flightNumber,confirmation,departAirport,arriveAirport,departAt(YYYY-MM-DDTHH:MM),arriveAt,cabin,seat}],hotels:[{name,address,phone,checkIn,checkOut,confirmation,guest}],ground:[{company,driver,phone,pickupAt,pickupLocation,dropoffLocation,confirmation}],notes}; booking_inquiry -> {clientName,clientEmail,clientPhone,date(YYYY-MM-DD),time,type,artistName,venue,city,state,price,notes}; payment_notice -> {amount,payer,method,memo,date}; gig_info -> {band,bandSize,choir,otherSingers:[],startTime(HH:MM),schedule:[{time,item}],songs:[{moment,song}],contacts:[{name,role,phone,email}],notes}; client_reply/other -> {}"),
  },
};

// deno-lint-ignore no-explicit-any
type Any = any;
const b64urlToStd = (s: string) => s.replace(/-/g, "+").replace(/_/g, "/");
function decodeBody(data: string): string {
  try { return new TextDecoder().decode(Uint8Array.from(atob(b64urlToStd(data)), (c) => c.charCodeAt(0))); } catch { return ""; }
}
function header(msg: Any, name: string): string {
  return (msg.payload?.headers || []).find((h: Any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}
function walk(part: Any, out: { text: string[]; html: string[]; attach: Any[] }) {
  if (!part) return;
  const mt = part.mimeType || "";
  if (part.filename && part.body?.attachmentId) out.attach.push({ filename: part.filename, mimeType: mt, id: part.body.attachmentId, size: part.body.size || 0 });
  else if (mt === "text/plain" && part.body?.data) out.text.push(decodeBody(part.body.data));
  else if (mt === "text/html" && part.body?.data) out.html.push(decodeBody(part.body.data));
  (part.parts || []).forEach((p: Any) => walk(p, out));
}
const stripHtml = (h: string) => h.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const cronSecret = Deno.env.get("CRON_SECRET");
  const fromCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
  if (!fromCron) { const auth = await requireAdmin(req, json); if (auth instanceof Response) return auth; }
  await readJson(req);
  const sb = serviceClient();
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ ok: false, error: "ANTHROPIC_API_KEY missing" }, 503);
  const gmail = await gmailSender(sb);
  if (!gmail) return json({ ok: false, error: "The office Gmail isn't connected." }, 503);
  const g = (path: string) => fetch(`${GMAIL}${path}`, { headers: { Authorization: `Bearer ${gmail.token}` } }).then((r) => r.json());

  const { data: state } = await sb.from("inbox_scan_state").select("last_internal_date").eq("id", 1).maybeSingle();
  const since = Number(state?.last_internal_date) || (Date.now() - FIRST_RUN_DAYS * 86_400_000);
  // Not "category:primary": this Workspace inbox has tabs off, so that matches nothing. Skip the bulk categories instead.
  const q = `in:inbox after:${Math.floor(since / 1000)} -from:${gmail.email} -category:promotions -category:social -category:forums`;
  const list = await g(`/messages?maxResults=${MAX_PER_RUN}&q=${encodeURIComponent(q)}`);
  if (list.error) { await sb.from("inbox_scan_state").update({ last_run_at: new Date().toISOString(), last_error: String(list.error.message || list.error) }).eq("id", 1); return json({ ok: false, error: list.error.message }, 502); }
  const ids: string[] = (list.messages || []).map((m: Any) => m.id);
  const { data: seen } = ids.length ? await sb.from("inbox_items").select("gmail_message_id").in("gmail_message_id", ids) : { data: [] };
  const seenSet = new Set((seen || []).map((r: Any) => r.gmail_message_id));
  const todo = ids.filter((id) => !seenSet.has(id));

  // Gigs the email could be about: recent past + upcoming, one compact line each.
  const from = new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10);
  const { data: evs } = await sb.from("events").select("legacy_id, date, status, client_name, venue, city, state, type, artist_id").gte("date", from).order("date").limit(600);
  const { data: artists } = await sb.from("artists").select("id, name");
  const artistName = new Map((artists || []).map((a: Any) => [a.id, a.name]));
  const gigLines = (evs || []).map((e: Any) => `${e.legacy_id} | ${e.date} | ${artistName.get(e.artist_id) || ""} | ${e.client_name || ""} | ${e.type || ""} | ${[e.venue, e.city, e.state].filter(Boolean).join(", ")} | ${e.status}`).join("\n");
  const knownGig = new Set((evs || []).map((e: Any) => e.legacy_id));

  const client = new Anthropic({ apiKey });
  let newest = since;
  const results: Any[] = [];
  for (const id of todo) {
    try {
      const msg = await g(`/messages/${id}?format=full`);
      const internal = Number(msg.internalDate) || 0;
      if (internal > newest) newest = internal;
      const parts = { text: [] as string[], html: [] as string[], attach: [] as Any[] };
      walk(msg.payload, parts);
      const body = (parts.text.join("\n") || stripHtml(parts.html.join("\n")) || msg.snippet || "").slice(0, MAX_BODY);
      const content: Anthropic.Beta.BetaContentBlockParam[] = [];
      for (const a of parts.attach.filter((x) => ATTACH_TYPES.includes(x.mimeType) && x.size <= MAX_ATTACH_BYTES).slice(0, 2)) {
        const att = await g(`/messages/${id}/attachments/${a.id}`);
        if (!att.data) continue;
        const data = b64urlToStd(att.data);
        content.push(a.mimeType === "application/pdf"
          ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
          : { type: "image", source: { type: "base64", media_type: a.mimeType, data } });
      }
      const subject = header(msg, "Subject"), fromAddr = header(msg, "From");
      content.push({ type: "text", text: `<email>\nFrom: ${fromAddr}\nSubject: ${subject}\nDate: ${header(msg, "Date")}\n\n${body}\n</email>\n\n<gigs>\nid | date | artist | client | type | place | status\n${gigLines}\n</gigs>` });
      const resp = await client.beta.messages.create({
        model: "claude-opus-5-5", max_tokens: 6000,
        betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
        output_config: { effort: "low", format: { type: "json_schema", schema } },
        system: "You triage the office inbox of ASP Management, a Jewish music artist agency (singers booked for weddings, bar mitzvahs, concerts). " +
          "Classify the email, summarize it for the office in one sentence, and match it to a gig from the list only when the client, date or artist clearly fit. " +
          "Use only what the email and attachments say. Put the extracted details, as a JSON object, in extracted_json.",
        messages: [{ role: "user", content }],
      });
      if (resp.stop_reason === "refusal") throw new Error("declined");
      const block = resp.content.find((b) => b.type === "text");
      const out = JSON.parse(block && block.type === "text" ? block.text : "{}");
      let extracted: Any = {};
      try { extracted = JSON.parse(out.extracted_json || "{}"); } catch { extracted = {}; }
      const gig = knownGig.has(out.event_legacy_id) ? out.event_legacy_id : null;
      await sb.from("inbox_items").upsert({
        gmail_message_id: id, gmail_thread_id: msg.threadId || null, received_at: internal ? new Date(internal).toISOString() : null,
        from_addr: fromAddr.slice(0, 300), subject: subject.slice(0, 300), snippet: String(msg.snippet || "").slice(0, 400),
        kind: out.kind || "other", summary: String(out.summary || "").slice(0, 500), event_legacy_id: gig,
        match_note: String(out.match_note || "").slice(0, 300), extracted,
        status: out.kind === "other" ? "dismissed" : "new",
      }, { onConflict: "gmail_message_id", ignoreDuplicates: true });
      results.push({ id, kind: out.kind, gig });
    } catch (err) {
      results.push({ id, error: String((err as Error)?.message || err).slice(0, 200) });
    }
  }
  await sb.from("inbox_scan_state").update({ last_internal_date: newest, last_run_at: new Date().toISOString(), last_error: null }).eq("id", 1);
  return json({ ok: true, scanned: todo.length, results });
});
