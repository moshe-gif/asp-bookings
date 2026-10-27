// Automatic client follow-ups (owner 2026-10-14), run once a day by pg_cron (and on demand by an admin):
//  - Deposit reminder every 7 days while a gig's contract has gone out (contract_sent) and no deposit is
//    recorded -- with a fresh link to the same contract + deposit payment (old links keep working).
//  - Balance reminder while a confirmed date (booked) has its balance due, until it's paid: every 7 days
//    within 8 weeks of the gig, every 14 days before that (owner 2026-10-26).
// Upcoming gigs only; never when the client has no email, and never for gigs still flagged needsReview. Every send (or failure) is logged in
// client_followups (0058), which is also how the rhythm is kept.
//  - A gig paid another way (paymentMethod cash / check / other) gets no weekly balance reminders, as the
//    app's Payment Method field promises. A Mezumin (cash) gig's client instead gets ONE reminder 3 days
//    before the gig -- email + WhatsApp: have $X in cash ready for the artist (owner 2026-10-27). The
//    artist sees what to collect in their gig info (artist_gig_view, migration 0066), not by message.
//
// Auth: the cron call sends header x-cron-secret = CRON_SECRET; an admin can also call it (dryRun:true
// lists what would go out without sending). Deployed with JWT verification off for the cron call.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";
import { sendRelayEmail } from "../_shared/mail.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";
import { emailHtml, esc } from "../_shared/clientmail.ts";
import { mintContractLink, mintBalanceLink } from "../_shared/paylinks.ts";
import { clientOwedCentsOf, depositCentsOf, gigContracts } from "../_shared/connect.ts";
import { paymentOptionsHtml, depositZelle, balanceZelle, officePhone } from "../_shared/payblock.ts";

const DAY = 86_400_000;
const EVERY_DAYS = 7;          // deposit reminders, and balance reminders within CLOSE_DAYS of the gig
const FAR_EVERY_DAYS = 14;     // balance reminders further out
const CLOSE_DAYS = 56;         // 8 weeks
const MAX_SENDS_PER_RUN = 40;

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;
const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const fmtDate = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const cronSecret = Deno.env.get("CRON_SECRET");
  const fromCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
  if (!fromCron) {
    const auth = await requireAdmin(req, json);
    if (auth instanceof Response) return auth;
  }
  // deno-lint-ignore no-explicit-any
  const body = (await readJson<any>(req)) || {};
  const dryRun = !!body.dryRun;
  // previewTo (admin only): send one sample of each kind to that address instead of the clients; nothing logged.
  const previewTo = !fromCron && typeof body.previewTo === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.previewTo) ? body.previewTo : "";
  const sb = serviceClient();
  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();

  const phone = (await officePhone(sb)) || "";

  const { data: events, error } = await sb.from("events").select("legacy_id, status, date, app_doc")
    .in("status", ["contract_sent", "booked"]).gte("date", today);
  if (error) return json({ ok: false, error: error.message }, 500);

  const { data: logs } = await sb.from("client_followups").select("event_legacy_id, kind, sent_at").eq("ok", true)
    .order("sent_at", { ascending: false }).limit(5000);
  const lastSent = new Map<string, number>();
  for (const l of logs || []) { const k = `${l.event_legacy_id}|${l.kind}`; if (!lastSent.has(k)) lastSent.set(k, Date.parse(l.sent_at)); }

  const planned: Row[] = [];
  const CASH_DAYS_BEFORE = 3;
  const { data: roster } = await sb.from("artists").select("id, legacy_id, name");
  const artistName = (id: string) => String((roster || []).find((r: Row) => r.legacy_id === id || r.id === id)?.name || "");
  for (const e of events || []) {
    const ev: Row = e.app_doc || {};
    const to = String(ev.clientEmail || "").trim();
    if (e.status === "booked" && ev.paymentMethod === "cash" && !ev.balanceReceived && !ev.unpaid && !ev.needsReview) {
      const daysOut = Math.round((Date.parse(e.date + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / DAY);
      const last = lastSent.get(`${e.legacy_id}|balance_reminder`);
      if (daysOut < 1 || daysOut > CASH_DAYS_BEFORE || (last !== undefined && now - last < 7 * DAY)) continue;
      if (!to && !ev.clientPhone) continue;
      const contracts = await gigContracts(sb, e.legacy_id);
      // No deposit received: the whole amount is due in cash (the same rule as the artist's view, 0066).
      const owed = clientOwedCentsOf(ev, contracts) + (ev.depositReceived ? 0 : depositCentsOf(ev, contracts));
      if (!Number.isFinite(owed) || owed <= 0) continue;
      const who = String(ev.clientName || "").trim();
      planned.push({ kind: "balance_reminder", cash: true, gig: e.legacy_id, to, phone: String(ev.clientPhone || "").trim(),
        greeting: who ? `Dear ${who.split(/\s+/)[0]},` : "Hello,", when: fmtDate(e.date), balance: owed / 100, artist: artistName(ev.artistId), ev });
      continue;
    }
    if (!to || ev.unpaid) continue;
    const who = String(ev.clientName || "").trim();
    const greeting = who ? `Dear ${who.split(/\s+/)[0]},` : "Hello,";
    const when = fmtDate(e.date);

    if (e.status === "contract_sent" && !ev.depositReceived) {
      const { data: reqs } = await sb.from("contract_sign_requests").select("id, contract_legacy_id, contract_created_at, created_at")
        .eq("event_legacy_id", e.legacy_id).is("revoked_at", null).order("created_at", { ascending: false }).limit(1);
      const sr = reqs?.[0];
      if (!sr) continue; // contract not sent through the app's link -- nothing to point them to
      const since = lastSent.get(`${e.legacy_id}|deposit_reminder`) ?? Date.parse(sr.created_at);
      if (now - since < EVERY_DAYS * DAY) continue;
      planned.push({ kind: "deposit_reminder", gig: e.legacy_id, contract: sr.contract_legacy_id, contractCreatedAt: sr.contract_created_at, to, greeting, when, ev });
    } else if (e.status === "booked" && ev.depositReceived && !ev.balanceReceived && (!ev.paymentMethod || ev.paymentMethod === "standard")) {
      // What the client owes after the contract's deposit (clientOwedCentsOf, the same figure as the app,
      // the pay link and the inbox's payment matching). NaN (an extra artist's figures missing) sends nothing.
      const owed = clientOwedCentsOf(ev, await gigContracts(sb, e.legacy_id));
      if (!Number.isFinite(owed) || owed <= 0) continue;
      const balance = owed / 100;
      // From the deposit on (owner 2026-10-14: "right after the deposit"): weekly within 8 weeks of the gig,
      // every 2 weeks before that (owner 2026-10-26). A gig never reminded yet is due at once. Gigs still
      // flagged for review get no balance reminders until reviewed.
      if (ev.needsReview) continue;
      const last = lastSent.get(`${e.legacy_id}|balance_reminder`);
      const daysOut = (Date.parse(e.date + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / DAY;
      const every = daysOut <= CLOSE_DAYS ? EVERY_DAYS : FAR_EVERY_DAYS;
      if (last !== undefined && now - last < every * DAY) continue;
      planned.push({ kind: "balance_reminder", gig: e.legacy_id, to, greeting, when, balance, ev });
    }
  }

  if (dryRun) return json({ ok: true, dryRun: true, wouldSend: planned.map((p) => ({ kind: p.kind, gig: p.gig, to: p.to, balance: p.balance ?? null, client: p.ev.clientName || '', price: p.ev.price, commission: p.ev.commission })) });

  const results: Row[] = [];
  const batch = previewTo
    ? ["deposit_reminder", "balance_reminder"].map((k) => planned.find((p) => p.kind === k)).filter(Boolean).map((p) => ({ ...p, to: previewTo }))
    : planned.slice(0, MAX_SENDS_PER_RUN);
  for (const p of batch) {
    let subject = "", html = "", contract: string | null = p.contract || null;
    try {
      if (p.kind === "deposit_reminder") {
        const link = await mintContractLink(sb, p.contract, p.contractCreatedAt);
        if (!link.ok) { results.push({ kind: p.kind, gig: p.gig, ok: false, skipped: link.error }); continue; } // void / changed / paid: the office handles it
        subject = `Reminder: your date is held once the deposit is received — ${p.when}`;
        html = emailHtml({
          greeting: p.greeting, phone,
          lines: [`This is a friendly reminder about your booking on <strong>${esc(p.when)}</strong>.`,
            "Your date is not held until the deposit is received. You can review and sign the agreement and pay the deposit using the button below."],
          button: { label: "Review & pay deposit", url: link.url },
          payment: paymentOptionsHtml({ kind: "deposit", payUrl: link.withPay ? link.url : null, memo: `${p.ev.clientName || ""} ${p.when}`.trim(), zelle: await depositZelle(sb), officePhone: phone }),
        });
      } else if (p.cash) {
        const by = p.artist ? ` for ${p.artist}` : "";
        subject = `Reminder: ${p.when} — please have ${money(p.balance)} in cash ready`;
        html = emailHtml({
          greeting: p.greeting, phone,
          lines: [`This is a friendly reminder that your event is coming up on <strong>${esc(p.when)}</strong>.`,
            `As arranged, the balance of <strong>${money(p.balance)}</strong> is paid in cash at the event. Please have it ready${esc(by)}.`],
        });
      } else {
        subject = `Balance reminder — ${p.when}`;
        // Pay online when the artist's payee has Stripe payouts set up (a new link row per send, so never for a
        // preview: that would leave a real payable link to a real gig). Otherwise Zelle/check as before.
        const bal = previewTo ? null : await mintBalanceLink(sb, p.gig);
        const payUrl = bal && bal.ok ? bal.url : null;
        html = emailHtml({
          greeting: p.greeting, phone,
          lines: [`Thank you for booking with ASP Management. Your date on <strong>${esc(p.when)}</strong> is confirmed.`,
            `This is a reminder that the remaining balance of <strong>${money(p.balance)}</strong> is due before the event.`],
          payment: paymentOptionsHtml({ kind: "balance", payUrl, amount: p.balance, memo: `${p.ev.clientName || ""} ${p.when}`.trim(), zelle: await balanceZelle(sb, p.gig), officePhone: phone }),
        });
      }
      const sent: { ok: boolean; error?: string; id?: string } = p.to
        ? await sendRelayEmail(sb, { to: p.to, subject: previewTo ? `[Preview] ${subject}` : subject, html, brand: "asp" })
        : { ok: false, error: "no client email" };
      if (previewTo) { results.push({ kind: p.kind, gig: p.gig, ok: sent.ok, error: sent.error, preview: true }); continue; }
      // The cash reminder also goes by WhatsApp (test mode: to the owner's phone). A business may only start a
      // chat with an approved template: WHATSAPP_TEMPLATE_CASH (params: first name, date, amount, artist) once
      // one is approved; until then a plain message, which WhatsApp only delivers inside a 24-hour window.
      let wa: { ok: boolean; error?: string } | null = null;
      if (p.cash && p.phone) {
        const tpl = Deno.env.get("WHATSAPP_TEMPLATE_CASH");
        const first = String(p.ev.clientName || "").trim().split(/\s+/)[0] || "there";
        wa = await sendWhatsApp(tpl
          ? { to: p.phone, template: { name: tpl, params: [first, p.when, money(p.balance), p.artist || "the artist"] } }
          : { to: p.phone, text: `Hi ${first}, a reminder from ASP Management: your event is on ${p.when}. As arranged, the balance of ${money(p.balance)} is paid in cash at the event -- please have it ready${p.artist ? ` for ${p.artist}` : ""}. Thank you!` });
      }
      const ok = sent.ok || !!wa?.ok;
      const err = [sent.ok ? "" : `email: ${sent.error}`, wa && !wa.ok ? `whatsapp: ${wa.error}` : ""].filter(Boolean).join("; ");
      await sb.from("client_followups").insert({ event_legacy_id: p.gig, contract_legacy_id: contract, kind: p.kind, sent_to: p.to || p.phone, ok, error: err ? err.slice(0, 500) : null, provider_id: sent.id || null });
      results.push({ kind: p.kind, gig: p.gig, ok, error: err || undefined, ...(wa ? { whatsapp: wa.ok } : {}) });
    } catch (err) {
      const msg = String((err as Error)?.message || err);
      await sb.from("client_followups").insert({ event_legacy_id: p.gig, contract_legacy_id: contract, kind: p.kind, sent_to: p.to, ok: false, error: msg.slice(0, 500) });
      results.push({ kind: p.kind, gig: p.gig, ok: false, error: msg });
    }
  }
  return json({ ok: true, sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
});
