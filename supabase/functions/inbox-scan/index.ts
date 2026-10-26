// Inbox watch (owner 2026-10-15): every 10 minutes (pg_cron) read new mail in EVERY connected Gmail
// mailbox (read-only; 0064 -- office@ plus e.g. the Zelle inbox), have Claude classify each message and
// match it to a gig, and record it in inbox_items (0062) for the app's Inbox list. Never sends, deletes
// or changes anything in Gmail, and never changes a gig itself.
// Money in (0064, owner 2026-10-21 "moniter money coming in"): for a payment email Claude also says what
// it pays -- an open invoice, a gig's deposit or its balance -- and this function checks the amount
// against what is actually due (exact or not) and whether the email is a bank's own DKIM-signed alert.
// The app applies only exact, bank-signed matches on its own; everything else waits for one click.
//
// Auth: x-cron-secret = CRON_SECRET (the schedule) or an admin (manual "Check now").
// Secrets: ANTHROPIC_API_KEY, GMAIL_CLIENT_ID/SECRET (token refresh, via _shared/mail.ts).
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";
import { gmailToken } from "../_shared/mail.ts";
import { clientOwedCentsOf, depositCentsOf } from "../_shared/connect.ts";
// Pinned here, not in _shared/deps.ts, so only the functions that call Claude load the SDK.
import Anthropic from "npm:@anthropic-ai/sdk@0.130.0";

const MAX_PER_RUN = 20;   // per mailbox
const FIRST_RUN_DAYS = 2;
const MAX_BODY = 8000;
const MAX_ATTACH_BYTES = 3_000_000;
const ATTACH_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";
// Banks whose "you received money" alerts count as proof once their own DKIM signature checks out.
const BANK_DOMAINS = ["chase.com", "bankofamerica.com", "wellsfargo.com", "zellepay.com", "tdbank.com", "citi.com", "capitalone.com", "usbank.com", "pnc.com", "ally.com", "valley.com", "mtb.com", "santander.us"];
// A 'payments' mailbox (e.g. the Zelle inbox) is only searched for payment mail.
const PAYMENT_TERMS = "(zelle OR payment OR paid OR deposit OR received OR invoice OR transfer OR sent you)";
// A singer's own mailbox (artist_payment) is personal: only money-received alerts are ever read from it
// (owner 2026-10-26: "read all emails from all my singers so you'll see their zelle come in").
const ARTIST_PAYMENT_TERMS = '(zelle OR quickpay OR "sent you" OR "you received" OR "money received")';

const str = (d: string) => ({ type: "string", description: d });
const schema = {
  type: "object", additionalProperties: false,
  required: ["kind", "summary", "event_legacy_id", "match_note", "pays", "invoice_id", "extracted_json"],
  properties: {
    kind: { type: "string", enum: ["travel_confirmation", "booking_inquiry", "payment_notice", "gig_info", "client_reply", "other"],
      description: "travel_confirmation = flight/hotel/car booking; booking_inquiry = someone asking to book an artist; payment_notice = money received (Zelle, bank, Stripe); gig_info = band/planner details for a gig (lineup, times, songs); client_reply = a client writing about an existing booking; other = anything else (newsletters, spam, internal)" },
    summary: str("One short sentence for the office: what this email is and what to do"),
    event_legacy_id: str("The matching gig's id from the list (e.g. EV-1063), or empty when none clearly matches"),
    match_note: str("Why it matches that gig (client, date, artist), or what you looked for; short"),
    pays: { type: "string", enum: ["deposit", "balance", "invoice", "none"], description: "For payment_notice only: what the money pays -- a gig's deposit, a gig's balance, or one of the open invoices; none when unclear or not a payment" },
    invoice_id: str("For pays=invoice: the open invoice's id from the list (e.g. INV-12); else empty"),
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

// The bank, when the email is its own alert: From is the bank's domain AND Gmail saw a passing DKIM
// signature for that same domain (so it can't be a look-alike or a client's forward).
function bankVerified(msg: Any, fromAddr: string): string | null {
  const dom = (fromAddr.match(/@([A-Za-z0-9.-]+)/)?.[1] || "").toLowerCase();
  const bank = BANK_DOMAINS.find((b) => dom === b || dom.endsWith("." + b));
  if (!bank) return null;
  const auth = (msg.payload?.headers || []).filter((h: Any) => h.name.toLowerCase() === "authentication-results").map((h: Any) => String(h.value).toLowerCase()).join(" ");
  return new RegExp(`dkim=pass[^;]*header\\.(?:d|i)=@?(?:[a-z0-9-]+\\.)*${bank.replace(/\./g, "\\.")}\\b`).test(auth) ? bank : null;
}

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
  const { data: boxes } = await sb.from("gmail_mailboxes").select("id, email, mailbox_type, last_internal_date").eq("scan_enabled", true).order("email");
  if (!boxes || !boxes.length) return json({ ok: false, error: "No Gmail mailbox is connected." }, 503);

  // Gigs the email could be about: recent past + upcoming, one compact line each, with what is still due.
  const from = new Date(Date.now() - 120 * 86_400_000).toISOString().slice(0, 10);
  const { data: evs } = await sb.from("events").select("legacy_id, date, status, client_name, venue, city, state, type, artist_id, app_doc").gte("date", from).order("date").limit(800);
  const { data: artists } = await sb.from("artists").select("id, legacy_id, name");
  const artistName = new Map((artists || []).flatMap((a: Any) => [[a.id, a.name], [a.legacy_id, a.name]]));
  const { data: recs } = await sb.from("app_records").select("collection, legacy_id, app_doc").in("collection", ["contracts", "invoices"]);
  const contracts = (recs || []).filter((r: Any) => r.collection === "contracts").map((r: Any) => r.app_doc).filter(Boolean);
  const due = new Map<string, { deposit: number; balance: number }>();
  for (const e of evs || []) {
    const ev = e.app_doc || {};
    // The same figures as the app, the reminders and the pay links (_shared/connect.ts).
    const cts = contracts.filter((c: Any) => c.leadId === e.legacy_id);
    due.set(e.legacy_id, { deposit: ev.depositReceived ? 0 : depositCentsOf(ev, cts), balance: ev.balanceReceived ? 0 : clientOwedCentsOf(ev, cts) });
  }
  const usd = (c: number) => Number.isFinite(c) && c > 0 ? "$" + (c / 100).toFixed(2) : "-";
  const gigLines = (evs || []).map((e: Any) => { const d = due.get(e.legacy_id)!; return `${e.legacy_id} | ${e.date} | ${artistName.get(e.artist_id) || artistName.get(e.app_doc?.artistId) || ""} | ${e.client_name || ""} | ${e.type || ""} | ${[e.venue, e.city, e.state].filter(Boolean).join(", ")} | ${e.status} | ${usd(d.deposit)} | ${usd(d.balance)}`; }).join("\n");
  const knownGig = new Set((evs || []).map((e: Any) => e.legacy_id));
  const invoices = (recs || []).filter((r: Any) => r.collection === "invoices" && r.app_doc && r.app_doc.status === "open").map((r: Any) => r.app_doc);
  const invTotal = (inv: Any) => Math.round((inv.items || []).reduce((s: number, it: Any) => s + (Number(it.amount) || 0), 0) * 100);
  const invoiceLines = invoices.map((inv: Any) => `${inv.id} | ${inv.createdAt || ""} | ${inv.clientName || ""} | ${usd(invTotal(inv))} | ${(inv.items || []).map((it: Any) => it.label).join("; ")}${inv.eventId ? ` | gig ${inv.eventId}` : ""}`).join("\n");
  const invById = new Map(invoices.map((inv: Any) => [inv.id, inv]));

  const client = new Anthropic({ apiKey });
  const runs: Any[] = [];
  for (const box of boxes) {
    const gmail = await gmailToken(sb, box);
    if (!gmail) continue;   // added in Settings but never connected
    const r = await scanMailbox(box, gmail.token);
    runs.push({ mailbox: box.email, ...r });
  }
  // The old single-mailbox state row is kept current for the app's "last checked" line.
  await sb.from("inbox_scan_state").update({ last_run_at: new Date().toISOString(), last_error: runs.map((r) => r.error ? `${r.mailbox}: ${r.error}` : "").filter(Boolean).join("; ") || null }).eq("id", 1);
  return json({ ok: true, scanned: runs.reduce((n, r) => n + (r.scanned || 0), 0), mailboxes: runs });

  async function scanMailbox(box: Any, token: string): Promise<Any> {
    const g = (path: string) => fetch(`${GMAIL}${path}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    const since = Number(box.last_internal_date) || (Date.now() - FIRST_RUN_DAYS * 86_400_000);
    // Not "category:primary": this Workspace inbox has tabs off, so that matches nothing. Skip the bulk categories instead.
    const q = box.mailbox_type === "artist_payment"
      ? `after:${Math.floor(since / 1000)} -in:spam -in:trash -from:${box.email} ${ARTIST_PAYMENT_TERMS}`
      : box.mailbox_type === "payments"
      ? `after:${Math.floor(since / 1000)} -in:spam -in:trash -from:${box.email} ${PAYMENT_TERMS}`
      : `in:inbox after:${Math.floor(since / 1000)} -from:${box.email} -category:promotions -category:social -category:forums`;
    // Gmail lists newest first: page back through everything since the last run, then work oldest first,
    // so a backlog bigger than one run is finished over the next runs instead of skipped.
    const ids: string[] = [];
    for (let page = 0, token = ""; page < 10; page++) {
      const list = await g(`/messages?maxResults=100&q=${encodeURIComponent(q)}${token ? `&pageToken=${token}` : ""}`);
      if (list.error) {
        const error = String(list.error.message || list.error);
        await sb.from("gmail_mailboxes").update({ last_scan_at: new Date().toISOString(), last_scan_error: error }).eq("id", box.id);
        return { error };
      }
      ids.push(...(list.messages || []).map((m: Any) => m.id));
      if (!list.nextPageToken) break;
      token = list.nextPageToken;
    }
    const seenSet = new Set<string>();
    for (let i = 0; i < ids.length; i += 200) {
      const { data: seen } = await sb.from("inbox_items").select("gmail_message_id").eq("mailbox_email", box.email).in("gmail_message_id", ids.slice(i, i + 200));
      (seen || []).forEach((r: Any) => seenSet.add(r.gmail_message_id));
    }
    const todo = ids.filter((id) => !seenSet.has(id)).reverse().slice(0, MAX_PER_RUN);
    let newest = since, failedAt = Infinity;
    const results: Any[] = [];
    for (const id of todo) {
      let internal = 0;
      try {
        const msg = await g(`/messages/${id}?format=full`);
        internal = Number(msg.internalDate) || 0;
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
        content.push({ type: "text", text: `<email>\nMailbox: ${box.email}\nFrom: ${fromAddr}\nSubject: ${subject}\nDate: ${header(msg, "Date")}\n\n${body}\n</email>\n\n<gigs>\nid | date | artist | client | type | place | status | deposit still due | balance still due\n${gigLines}\n</gigs>\n\n<open_invoices>\nid | date | billed to | total | items | gig\n${invoiceLines || "(none)"}\n</open_invoices>` });
        const resp = await client.beta.messages.create({
          model: "claude-opus-5-5", max_tokens: 6000,
          betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
          output_config: { effort: "low", format: { type: "json_schema", schema } },
          system: "You triage the inboxes of ASP Management, a Jewish music artist agency (singers booked for weddings, bar mitzvahs, concerts). " +
            "Classify the email, summarize it for the office in one sentence, and match it to a gig from the list only when the client, date or artist clearly fit. " +
            "For a payment (Zelle/bank alert, Stripe, Plooto, a client saying they paid, an Invoice2go paid notice), say what it pays: an open invoice (by its id, the billed-to name, or the amount), " +
            "or a gig's deposit or balance (by the payer, memo and amount compared with what is still due). " +
            "Use only what the email and attachments say. Put the extracted details, as a JSON object, in extracted_json; for a payment give amount as a plain number of dollars.",
          messages: [{ role: "user", content }],
        });
        if (resp.stop_reason === "refusal") throw new Error("declined");
        const block = resp.content.find((b) => b.type === "text");
        const out = JSON.parse(block && block.type === "text" ? block.text : "{}");
        let extracted: Any = {};
        try { extracted = JSON.parse(out.extracted_json || "{}"); } catch { extracted = {}; }
        const gig = knownGig.has(out.event_legacy_id) ? out.event_legacy_id : null;
        const money = out.kind === "payment_notice" ? moneyOf(msg, fromAddr, extracted, out, gig) : null;
        await sb.from("inbox_items").upsert({
          mailbox_email: box.email,
          gmail_message_id: id, gmail_thread_id: msg.threadId || null, received_at: internal ? new Date(internal).toISOString() : null,
          from_addr: fromAddr.slice(0, 300), subject: subject.slice(0, 300), snippet: String(msg.snippet || "").slice(0, 400),
          kind: out.kind || "other", summary: String(out.summary || "").slice(0, 500), event_legacy_id: gig,
          match_note: String(out.match_note || "").slice(0, 300), extracted, money,
          status: out.kind === "other" ? "dismissed" : "new",
        }, { onConflict: "mailbox_email,gmail_message_id", ignoreDuplicates: true });
        results.push({ id, kind: out.kind, gig, money: money && money.match ? `${money.match.kind} ${money.match.ref}${money.match.exact ? " exact" : ""}` : undefined });
      } catch (err) {
        if (internal) failedAt = Math.min(failedAt, internal);
        results.push({ id, error: String((err as Error)?.message || err).slice(0, 200) });
      }
    }
    // Never move the read position past an email that failed: the next run tries it again.
    if (failedAt < Infinity) newest = Math.max(since, Math.min(newest, failedAt - 1000));
    await sb.from("gmail_mailboxes").update({ last_internal_date: newest, last_scan_at: new Date().toISOString(), last_scan_error: null }).eq("id", box.id);
    return { scanned: todo.length, results };
  }

  // What a payment email pays and whether the amount is exactly what's due. Claude proposes; this checks.
  function moneyOf(msg: Any, fromAddr: string, x: Any, out: Any, gig: string | null): Any {
    const amount_cents = Math.round((Number(String(x.amount ?? "").replace(/[^0-9.]/g, "")) || 0) * 100) || null;
    const bank = bankVerified(msg, fromAddr);
    let match: Any = null;
    if (out.pays === "invoice" && invById.has(out.invoice_id)) {
      const due_cents = invTotal(invById.get(out.invoice_id));
      match = { kind: "invoice", ref: out.invoice_id, due_cents, exact: !!amount_cents && amount_cents === due_cents };
    } else if ((out.pays === "deposit" || out.pays === "balance") && gig) {
      const d = due.get(gig)!;
      const due_cents = out.pays === "deposit" ? d.deposit : d.balance;
      if (Number.isFinite(due_cents) && due_cents > 0) match = { kind: out.pays, ref: gig, due_cents, exact: !!amount_cents && amount_cents === due_cents };
      else match = { kind: out.pays, ref: gig, due_cents: 0, exact: false, note: "already recorded as received (or nothing due)" };
    }
    return { amount_cents, payer: String(x.payer || "").slice(0, 200), method: String(x.method || "").slice(0, 60), date: String(x.date || "").slice(0, 10), memo: String(x.memo || "").slice(0, 300), bank_verified: !!bank, bank, match };
  }
});
