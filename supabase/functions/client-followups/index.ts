// Automatic client follow-ups (owner 2026-10-14), run once a day by pg_cron (and on demand by an admin):
//  - Deposit reminder every 7 days while a gig's contract has gone out (contract_sent) and no deposit is
//    recorded -- with a fresh link to the same contract + deposit payment (old links keep working).
//  - Balance reminder every 7 days while a confirmed date (booked) has its balance due, until it's paid.
// Upcoming gigs only; never for gigs still flagged needsReview. Every send (or failure) is logged in
// client_followups (0058), which is also how the 7-day rhythm is kept.
// WhatsApp too (owner 2026-10-29: "i want the balance and deposit reminders to go to whatsapp also"): each
// reminder also goes to the client's phone (approved template, _shared/whatsapp.ts), logged with sent_to
// "whatsapp:<number>". And {only:"deposit_confirmations"} (cron every 10 minutes): "when a deposit comes in i
// want to send a auto whatsapp to the client saying we received the deposit and booking is confirmed" -- once
// per gig (kind deposit_confirmed). Gigs whose deposit was in before this shipped were marked done by SQL.
// Test mode applies to both (mail.ts / whatsapp.ts).
// More WhatsApps (owner 2026-11-04, "all" of them), each sent once and logged here (0080):
//  - every 10 minutes with the deposit confirmations: contract sent (the client gets the sign link), balance
//    paid (a thank-you), and office alerts (contract signed, deposit in, balance paid) to the number in
//    Settings → Office alerts on WhatsApp;
//  - on the daily run: each singer's gig reminder 3 days before the gig, and "prepare for your flight" 3 days
//    before the gig's flight -- to the singer's WhatsApp number (Settings → accounts). The daily run also
//    submits any message template Meta doesn't have yet.
//
// Auth: the cron call sends header x-cron-secret = CRON_SECRET; an admin can also call it (dryRun:true
// lists what would go out without sending). Deployed with JWT verification off for the cron call.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";
import { sendRelayEmail } from "../_shared/mail.ts";
import { brandLogoHtml } from "../_shared/config.ts";
import { mintContractLink, mintBalanceLink } from "../_shared/paylinks.ts";
import { clientOwedCentsOf, gigContracts } from "../_shared/connect.ts";
import { paymentOptionsHtml, depositZelle, balanceZelle, officePhone } from "../_shared/payblock.ts";
import { createTemplates360, sendTemplate, waNumber } from "../_shared/whatsapp.ts";

const DAY = 86_400_000;
const EVERY_DAYS = 7;
const MAX_SENDS_PER_RUN = 40;

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const fmtDate = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const nyToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
const plusDays = (iso: string, n: number) => new Date(Date.parse(iso + "T12:00:00Z") + n * DAY).toISOString().slice(0, 10);
// "18:00" -> "6:00 PM"
const fmtTime = (t: string) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || "")); if (!m) return ""; const h = Number(m[1]); return `${(h % 12) || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`; };
const firstName = (s: unknown) => String(s || "").trim().split(/\s+/)[0] || "there";

function emailHtml(o: { greeting: string; lines: string[]; button?: { label: string; url: string }; payment?: string; phone: string }) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#F5F4EF;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17171A;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;">
    <div style="padding:20px 24px 14px;border-bottom:1px solid #E3E3E8;">${brandLogoHtml(180)}</div>
    <div style="padding:24px;font-size:14px;line-height:1.6;">
      <p style="margin:0 0 12px;">${esc(o.greeting)}</p>
      ${o.lines.map((l) => `<p style="margin:0 0 12px;">${l}</p>`).join("")}
      ${o.button ? `<p style="margin:18px 0;"><a href="${esc(o.button.url)}" style="display:inline-block;background:#4C6FA5;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;">${esc(o.button.label)}</a></p>` : ""}
      ${o.payment || ""}
      <p style="margin:18px 0 0;">Thank you,<br/>ASP Management</p>
    </div>
    <div style="padding:12px 24px;border-top:1px solid #E3E3E8;font-size:11px;color:#6B6B72;">ASP Management &middot; office@aspmgmt.com${o.phone ? ` &middot; ${esc(o.phone)}` : ""}</div>
  </div></body></html>`;
}

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

  const { data: events, error } = await sb.from("events").select("legacy_id, status, date, artist_id, app_doc")
    .in("status", ["contract_sent", "booked", "paid"]).gte("date", today);
  if (error) return json({ ok: false, error: error.message }, 500);

  // Submit any message template Meta doesn't have yet (also done by the daily run).
  if (body.only === "submit_templates") return json({ ok: true, templates: await createTemplates360() });

  // Who's who, and what was already sent once (kind|gig|ref).
  const { data: artists } = await sb.from("artists").select("id, legacy_id, name, whatsapp");
  const artistOf = (ref: string) => (artists || []).find((a: Row) => a.id === ref || a.legacy_id === ref);
  const nameOf = (ref: string) => artistOf(ref)?.name;
  const singersOf = (e: Row) => [e.artist_id || e.app_doc?.artistId, ...(((e.app_doc || {}).additionalArtists || []).map((x: Row) => x?.artistId))].filter(Boolean).map(String);
  const singerNames = (e: Row) => singersOf(e).map((r) => nameOf(r)).filter(Boolean).join(" & ") || "your event";
  const onceKinds = ["deposit_confirmed", "contract_sent", "balance_paid", "gig_reminder", "flight_reminder", "office_signed", "office_deposit", "office_balance"];
  const { data: doneRows } = await sb.from("client_followups").select("event_legacy_id, kind, ref").in("kind", onceKinds).eq("ok", true).limit(20000);
  const done = new Set((doneRows || []).map((d: Row) => `${d.kind}|${d.event_legacy_id}|${d.ref || ""}`));
  const results: Row[] = [];
  const once = async (kind: string, gig: string, ref: string, to: string, template: string, params: string[]) => {
    if (done.has(`${kind}|${gig}|${ref}`) || results.length >= MAX_SENDS_PER_RUN) return;
    done.add(`${kind}|${gig}|${ref}`);
    if (dryRun) { results.push({ kind, gig, to, dryRun: true, ok: true }); return; }
    const wa = await sendTemplate(to, template, params);
    // Held until Meta approves the template: not logged, so the next run tries again.
    if (!wa.ok && /waiting for Meta/.test(String(wa.error))) { done.delete(`${kind}|${gig}|${ref}`); results.push({ kind, gig, ok: false, held: true }); return; }
    await sb.from("client_followups").insert({ event_legacy_id: gig, kind, ref: ref || null, sent_to: "whatsapp:" + waNumber(to), ok: wa.ok, error: wa.ok ? null : wa.error, provider_id: wa.id || null });
    results.push({ kind, gig, ok: wa.ok, error: wa.error });
  };
  const { data: orgRow } = await sb.from("app_records").select("app_doc").eq("collection", "settings").eq("legacy_id", "org").maybeSingle();
  const officeTo = waNumber(orgRow?.app_doc?.value?.alertsWhatsApp || "").length >= 10 ? String(orgRow.app_doc.value.alertsWhatsApp) : "";
  const hasPhone = (x: unknown) => waNumber(String(x || "")).length >= 10;

  if (body.only === "deposit_confirmations") {
    for (const e of events || []) {
      const ev: Row = e.app_doc || {};
      if (ev.unpaid) continue;
      const who = firstName(ev.clientName), when = fmtDate(e.date), singers = singerNames(e);
      if (ev.depositReceived) {
        if (hasPhone(ev.clientPhone)) await once("deposit_confirmed", e.legacy_id, "", ev.clientPhone, "deposit_received", [who, singers, when]);
        if (officeTo) await once("office_deposit", e.legacy_id, "", officeTo, "office_alert", [`deposit in from ${ev.clientName || "a client"}, ${singers} on ${when}.`]);
      }
      if (ev.balanceReceived) {
        if (hasPhone(ev.clientPhone)) await once("balance_paid", e.legacy_id, "", ev.clientPhone, "balance_paid", [who, singers, when]);
        if (officeTo) await once("office_balance", e.legacy_id, "", officeTo, "office_alert", [`balance paid by ${ev.clientName || "a client"}, ${singers} on ${when}.`]);
      }
    }
    // Contracts sent in the last 3 days (one notice per contract version) and contracts signed.
    const byGig = new Map((events || []).map((e: Row) => [e.legacy_id, e]));
    const { data: reqs } = await sb.from("contract_sign_requests").select("id, event_legacy_id, contract_legacy_id, contract_created_at, created_at, revoked_at, signed_at, signer_name")
      .not("event_legacy_id", "is", null).gte("created_at", new Date(now - 3 * DAY).toISOString()).order("created_at", { ascending: false }).limit(500);
    const { data: signed } = await sb.from("contract_sign_requests").select("id, event_legacy_id, contract_legacy_id, signed_at, signer_name")
      .not("event_legacy_id", "is", null).not("signed_at", "is", null).gte("signed_at", new Date(now - 3 * DAY).toISOString()).limit(500);
    for (const r of reqs || []) {
      const e = byGig.get(r.event_legacy_id), ev: Row = e?.app_doc || {};
      if (!e || r.revoked_at || r.signed_at || ev.depositReceived || ev.unpaid || !hasPhone(ev.clientPhone) || String(r.contract_legacy_id).startsWith("CT-TEST-")) continue;
      const ref = `${r.contract_legacy_id}@${r.contract_created_at}`;
      if (done.has(`contract_sent|${e.legacy_id}|${ref}`)) continue;
      const link = dryRun ? { ok: true, url: "" } : await mintContractLink(sb, r.contract_legacy_id, r.contract_created_at);
      if (!link.ok) continue;
      await once("contract_sent", e.legacy_id, ref, ev.clientPhone, "contract_sent", [firstName(ev.clientName), singerNames(e), fmtDate(e.date), link.url || ""]);
    }
    for (const r of signed || []) {
      const e = byGig.get(r.event_legacy_id);
      if (!e || !officeTo || String(r.contract_legacy_id).startsWith("CT-TEST-")) continue;
      await once("office_signed", e.legacy_id, String(r.id), officeTo, "office_alert", [`${r.signer_name || "the client"} signed the contract for ${singerNames(e)} on ${fmtDate(e.date)}.`]);
    }
    return json({ ok: true, sent: results.filter((r) => r.ok && !r.dryRun).length, failed: results.filter((r) => !r.ok).length, results });
  }

  // Daily: singers' gig reminders and flight reminders, 3 days ahead (New York dates).
  const inThree = plusDays(nyToday(), 3);
  for (const e of previewTo ? [] : events || []) {
    const ev: Row = e.app_doc || {};
    if (e.status !== "booked" && e.status !== "paid") continue;
    const title = String(ev.clientName || ev.type || "your gig").trim();
    const place = [ev.venue, ev.address, ev.city].filter(Boolean).join(", ") || "the venue (in the app)";
    if (e.date === inThree) {
      for (const ref of singersOf(e)) {
        const a = artistOf(ref);
        if (a && hasPhone(a.whatsapp)) await once("gig_reminder", e.legacy_id, String(a.id), a.whatsapp, "gig_reminder",
          [firstName(a.name), title, `${fmtDate(e.date)}${fmtTime(ev.time) ? `, ${fmtTime(ev.time)}` : ""}`, place]);
      }
    }
    const f = ev.flight || {};
    const departDay = String(f.depart || "").slice(0, 10);
    if (departDay === inThree && (f.flightNumber || f.airline)) {
      const a = artistOf(String(e.artist_id || ev.artistId || ""));
      const hm = String(f.depart).slice(11, 16);
      if (a && hasPhone(a.whatsapp)) await once("flight_reminder", e.legacy_id, String(a.id), a.whatsapp, "flight_reminder",
        [firstName(a.name), [f.flightNumber, f.airline ? `(${f.airline})` : ""].filter(Boolean).join(" "), `${fmtDate(departDay)}${fmtTime(hm) ? `, ${fmtTime(hm)}` : ""}`,
         `the ${title} event${ev.city ? ` in ${ev.city}` : ""}`]);
    }
  }
  const notices = results.splice(0);
  if (!dryRun && fromCron) await createTemplates360().catch(() => null);   // submit any template Meta doesn't have yet

  const { data: logs } = await sb.from("client_followups").select("event_legacy_id, kind, sent_at").eq("ok", true)
    .order("sent_at", { ascending: false }).limit(5000);
  const lastSent = new Map<string, number>();
  for (const l of logs || []) { const k = `${l.event_legacy_id}|${l.kind}`; if (!lastSent.has(k)) lastSent.set(k, Date.parse(l.sent_at)); }

  const planned: Row[] = [];
  for (const e of events || []) {
    const ev: Row = e.app_doc || {};
    const to = String(ev.clientEmail || "").trim();
    const waTo = waNumber(ev.clientPhone || "").length >= 10 ? String(ev.clientPhone) : "";
    if ((!to && !waTo) || ev.unpaid || e.status === "paid") continue;
    // Cash / check / other arrangements get no automated reminders -- the app says so on the gig (isStandardPayment);
    // the server used to send them anyway (SSOT audit 2026-11-02).
    if (ev.paymentMethod && ev.paymentMethod !== "standard") continue;
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
      planned.push({ kind: "deposit_reminder", gig: e.legacy_id, contract: sr.contract_legacy_id, contractCreatedAt: sr.contract_created_at, to, waTo, greeting, when, ev });
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
      planned.push({ kind: "balance_reminder", gig: e.legacy_id, to, waTo, greeting, when, balance, ev });
    }
  }

  if (dryRun) return json({ ok: true, dryRun: true, notices, wouldSend: planned.map((p) => ({ kind: p.kind, gig: p.gig, to: p.to, whatsapp: p.waTo || null, balance: p.balance ?? null, client: p.ev.clientName || '', price: p.ev.price, commission: p.ev.commission })) });

  const batch = previewTo
    ? ["deposit_reminder", "balance_reminder"].map((k) => planned.find((p) => p.kind === k)).filter(Boolean).map((p) => ({ ...p, to: previewTo }))
    : planned.slice(0, MAX_SENDS_PER_RUN);
  for (const p of batch) {
    let subject = "", html = "", contract: string | null = p.contract || null, waParams: string[] = [];
    const first = String(p.ev.clientName || "").trim().split(/\s+/)[0] || "there";
    try {
      if (p.kind === "deposit_reminder") {
        const link = await mintContractLink(sb, p.contract, p.contractCreatedAt);
        if (!link.ok) { results.push({ kind: p.kind, gig: p.gig, ok: false, skipped: link.error }); continue; } // void / changed / paid: the office handles it
        waParams = [first, p.when, link.url];
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
        waParams = [first, money(p.balance), p.when, payUrl ? `Pay online: ${payUrl}` : (p.to ? "Payment details are in your email." : "Reply here for payment details.")];
        html = emailHtml({
          greeting: p.greeting, phone,
          lines: [`Thank you for booking with ASP Management. Your date on <strong>${esc(p.when)}</strong> is confirmed.`,
            `This is a reminder that the remaining balance of <strong>${money(p.balance)}</strong> is due before the event.`],
          payment: paymentOptionsHtml({ kind: "balance", payUrl, amount: p.balance, memo: `${p.ev.clientName || ""} ${p.when}`.trim(), zelle: await balanceZelle(sb, p.gig), officePhone: phone }),
        });
      }
      if (p.to) {
        const sent = await sendRelayEmail(sb, { to: p.to, subject: previewTo ? `[Preview] ${subject}` : subject, html, brand: "asp" });
        if (previewTo) { results.push({ kind: p.kind, gig: p.gig, ok: sent.ok, error: sent.error, preview: true }); continue; }
        await sb.from("client_followups").insert({ event_legacy_id: p.gig, contract_legacy_id: contract, kind: p.kind, sent_to: p.to, ok: sent.ok, error: sent.ok ? null : sent.error, provider_id: sent.id || null });
        results.push({ kind: p.kind, gig: p.gig, ok: sent.ok, error: sent.error });
      }
      if (p.waTo && !previewTo) {
        const wa = await sendTemplate(p.waTo, p.kind, waParams);
        await sb.from("client_followups").insert({ event_legacy_id: p.gig, contract_legacy_id: contract, kind: p.kind, sent_to: "whatsapp:" + waNumber(p.waTo), ok: wa.ok, error: wa.ok ? null : wa.error, provider_id: wa.id || null });
        results.push({ kind: p.kind, gig: p.gig, channel: "whatsapp", ok: wa.ok, error: wa.error });
      }
    } catch (err) {
      const msg = String((err as Error)?.message || err);
      await sb.from("client_followups").insert({ event_legacy_id: p.gig, contract_legacy_id: contract, kind: p.kind, sent_to: p.to, ok: false, error: msg.slice(0, 500) });
      results.push({ kind: p.kind, gig: p.gig, ok: false, error: msg });
    }
  }
  results.push(...notices);
  return json({ ok: true, sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
});
