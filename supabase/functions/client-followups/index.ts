// Automatic client follow-ups (owner 2026-10-14), run once a day by pg_cron (and on demand by an admin):
//  - Deposit reminder every 7 days while a gig's contract has gone out (contract_sent) and no deposit is
//    recorded -- with a fresh link to the same contract + deposit payment (old links keep working).
//  - Balance reminder every 7 days while a confirmed date (booked) has its balance due, until it's paid.
// Upcoming gigs only; never when the client has no email, and never for gigs still flagged needsReview. Every send (or failure) is logged in
// client_followups (0058), which is also how the 7-day rhythm is kept.
//
// Auth: the cron call sends header x-cron-secret = CRON_SECRET; an admin can also call it (dryRun:true
// lists what would go out without sending). Deployed with JWT verification off for the cron call.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";
import { sendRelayEmail } from "../_shared/mail.ts";
import { emailHtml, esc } from "../_shared/clientmail.ts";
import { mintContractLink, mintBalanceLink } from "../_shared/paylinks.ts";
import { clientOwedCentsOf, gigContracts } from "../_shared/connect.ts";
import { paymentOptionsHtml, depositZelle, balanceZelle, officePhone } from "../_shared/payblock.ts";

const DAY = 86_400_000;
const EVERY_DAYS = 7;
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
  for (const e of events || []) {
    const ev: Row = e.app_doc || {};
    const to = String(ev.clientEmail || "").trim();
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
    } else if (e.status === "booked" && ev.depositReceived && !ev.balanceReceived) {
      // What the client owes after the contract's deposit (clientOwedCentsOf, the same figure as the app,
      // the pay link and the inbox's payment matching). NaN (an extra artist's figures missing) sends nothing.
      const owed = clientOwedCentsOf(ev, await gigContracts(sb, e.legacy_id));
      if (!Number.isFinite(owed) || owed <= 0) continue;
      const balance = owed / 100;
      // Weekly from the deposit on (owner 2026-10-14: "right after the deposit"); a gig with no deposit
      // date (imported) is due at once. Gigs still flagged for review keep their reminders until reviewed.
      if (ev.needsReview) continue;
      const last = lastSent.get(`${e.legacy_id}|balance_reminder`);
      if (last !== undefined && now - last < EVERY_DAYS * DAY) continue;
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
      const sent = await sendRelayEmail(sb, { to: p.to, subject: previewTo ? `[Preview] ${subject}` : subject, html, brand: "asp" });
      if (previewTo) { results.push({ kind: p.kind, gig: p.gig, ok: sent.ok, error: sent.error, preview: true }); continue; }
      await sb.from("client_followups").insert({ event_legacy_id: p.gig, contract_legacy_id: contract, kind: p.kind, sent_to: p.to, ok: sent.ok, error: sent.ok ? null : sent.error, provider_id: sent.id || null });
      results.push({ kind: p.kind, gig: p.gig, ok: sent.ok, error: sent.error });
    } catch (err) {
      const msg = String((err as Error)?.message || err);
      await sb.from("client_followups").insert({ event_legacy_id: p.gig, contract_legacy_id: contract, kind: p.kind, sent_to: p.to, ok: false, error: msg.slice(0, 500) });
      results.push({ kind: p.kind, gig: p.gig, ok: false, error: msg });
    }
  }
  return json({ ok: true, sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
});
