// Mercury: money in from the bank, and each singer's share moved into their own account (migration
// 0067, ops/MERCURY_SETUP.md; owner 2026-10-27: "create sub accounts that the money can automatically
// get split up so my payouts are easier").
//
//   POST { action: "sync" }                                    cron (x-cron-secret) or an admin
//     1. reads ASP's Mercury accounts and every incoming credit on them (read-only on the bank);
//     2. each settled credit becomes an inbox "Money in" row (bank 'Mercury', bank-verified), matched to
//        a gig's deposit or balance or an open invoice by amount and the payer's name -- the app records
//        exact matches on its own, exactly like a bank's email alert;
//     3. every recorded client payment that reached ASP (a Mercury credit, or a Stripe payment) is saved
//        once in the money ledger with its split: each singer's share and ASP's commission (0078).
//   POST { action: "status" }                                  admin: accounts, ledger, monthly payouts
//   POST { action: "assign", accountId, role, payeeProfileId } owner/COO/bookkeeping: main / a singer's / ignore
//   POST { action: "recipients" }                              owner/COO/bookkeeping: Mercury's outside recipients
//   POST { action: "set_commission", recipientId }             owner/COO/bookkeeping: where the commission goes
//   POST { action: "pay_month", month: "YYYY-MM" }             owner/COO/bookkeeping: the month's payouts --
//        one transfer per singer to their own account, one payment of the commission to the recipient
//   POST { action: "resplit", id }                             owner/COO/bookkeeping: drop a ledger row that
//        needs review so the next check records it again (after the gig is fixed)
//
// Owner 2026-11-04: payouts are monthly, not per gig. Money moves only on "pay_month", and only on
// Mercury's sandbox or with MERCURY_LIVE=yes (otherwise it answers what it would send and records
// nothing); Mercury then holds each move until someone approves it in Mercury.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";
import { artistShares, clientOwedCentsOf, depositCentsOf } from "../_shared/connect.ts";
import { mercuryApi, mercuryCanMoveMoney, mercuryConfigured, mercuryError, mercurySandbox } from "../_shared/mercury.ts";
import { sendRelayEmail } from "../_shared/mail.ts";
import { nameTokens } from "../_shared/matching.ts";
import { emailHeaderHtml } from "../_shared/config.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const FIRST_DAYS = 45, OVERLAP_DAYS = 10;
const MONEY_ROLES = ["admin_ceo", "admin_coo", "admin_bookkeeping"];
// Credits that aren't a client paying: moves between ASP's own accounts, interest, refunds of fees.
const NOT_CLIENT_KINDS = ["internalTransfer", "treasuryTransfer", "interestPayment"];
const KIND_METHOD: Record<string, string> = {
  incomingDomesticWire: "wire", incomingInternationalWire: "wire", checkDeposit: "check", externalTransfer: "ACH",
};
const usd = (c: number) => "$" + (c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nyDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d);
const monthEnd = (m: string) => { const [y, mo] = m.split("-").map(Number); return new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10); };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const cronSecret = Deno.env.get("CRON_SECRET");
  const fromCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
  let userId: string | null = null;
  if (!fromCron) {
    const auth = await requireAdmin(req, json); if (auth instanceof Response) return auth;
    userId = auth.user.id;
  }
  const body: Any = (await readJson(req)) || {};
  const action = fromCron ? "sync" : String(body.action || "status");
  const sb = serviceClient();

  if (action === "status") {
    const since = new Date(Date.now() - 400 * 86_400_000).toISOString().slice(0, 10);
    const [{ data: accounts }, { data: state }, { data: ledger }, { data: payouts }, { data: settings }] = await Promise.all([
      sb.from("mercury_accounts").select("account_id, name, kind, status, role, payee_profile_id").order("name"),
      sb.from("mercury_sync_state").select("last_run_at, last_error").eq("id", 1).maybeSingle(),
      sb.from("money_ledger").select("*, parts:money_ledger_parts(*)").gte("received_on", since).order("received_on", { ascending: false }).limit(2000),
      sb.from("monthly_payouts").select("*").order("created_at", { ascending: false }).limit(500),
      sb.from("mercury_settings").select("commission_recipient_id, commission_recipient_name").eq("id", 1).maybeSingle(),
    ]);
    // Older unpaid parts still count toward the next payout.
    const { data: oldUnpaid } = await sb.from("money_ledger").select("*, parts:money_ledger_parts!inner(*)").lt("received_on", since).is("parts.payout_id", null).limit(500);
    return json({ ok: true, configured: mercuryConfigured(), sandbox: mercuryConfigured() && mercurySandbox(), canMoveMoney: mercuryConfigured() && mercuryCanMoveMoney() && !mercurySandbox(),
      accounts: accounts || [], ledger: [...(ledger || []), ...(oldUnpaid || [])], payouts: payouts || [],
      commission: { recipientId: settings?.commission_recipient_id || null, name: settings?.commission_recipient_name || null },
      lastRunAt: state?.last_run_at || null, lastError: state?.last_error || null });
  }
  if (!mercuryConfigured()) return json({ ok: false, error: "Mercury is not connected yet (MERCURY_API_TOKEN)." }, 503);

  // Which account gets whose money, and moving it: the owner, COO or bookkeeping only.
  if (["assign", "recipients", "set_commission", "pay_month", "resplit", "void_payout"].includes(action)) {
    const { data: me } = await sb.from("admin_users").select("role").eq("user_id", userId).maybeSingle();
    if (!me || !MONEY_ROLES.includes(me.role)) return json({ ok: false, error: "Only the owner, COO or bookkeeping can do that." }, 403);
  }

  if (action === "assign") {
    const role = body.role === "main" || body.role === "payee" || body.role === "ignore" ? body.role : null;
    const payee = role === "payee" ? String(body.payeeProfileId || "").slice(0, 64) : null;
    if (role === "payee" && !payee) return json({ ok: false, error: "Pick whose account it is." }, 400);
    if (role === "payee") {
      const { data: p } = await sb.from("app_records").select("legacy_id").eq("collection", "payee_profiles").eq("legacy_id", payee).maybeSingle();
      if (!p) return json({ ok: false, error: "No such payee profile." }, 400);
    }
    // One main account, one account per payee: clear the old holder first.
    if (role === "main") await sb.from("mercury_accounts").update({ role: null }).eq("role", "main").neq("account_id", String(body.accountId));
    if (role === "payee") await sb.from("mercury_accounts").update({ role: null, payee_profile_id: null }).eq("role", "payee").eq("payee_profile_id", payee).neq("account_id", String(body.accountId));
    const { data, error } = await sb.from("mercury_accounts").update({ role, payee_profile_id: payee, updated_at: new Date().toISOString() })
      .eq("account_id", String(body.accountId)).select("account_id");
    if (error) return json({ ok: false, error: error.message }, 500);
    if (!data?.length) return json({ ok: false, error: "No such account." }, 404);
    return json({ ok: true });
  }

  if (action === "recipients") {
    const r = await mercuryApi("GET", "/recipients");
    if (!r.ok) return json({ ok: false, error: `recipients: ${mercuryError(r)}` }, 502);
    const list = (r.data?.recipients || []).filter((x: Any) => x?.id && x.status !== "deleted")
      .map((x: Any) => ({ id: String(x.id), name: String(x.nickname || x.name || "Recipient").slice(0, 120) }));
    return json({ ok: true, recipients: list });
  }

  if (action === "set_commission") {
    const id = String(body.recipientId || "").slice(0, 64);
    let name: string | null = null;
    if (id) {
      const r = await mercuryApi("GET", "/recipients");
      if (!r.ok) return json({ ok: false, error: `recipients: ${mercuryError(r)}` }, 502);
      const hit = (r.data?.recipients || []).find((x: Any) => String(x?.id) === id);
      if (!hit) return json({ ok: false, error: "Mercury has no such recipient." }, 400);
      name = String(hit.nickname || hit.name || "Recipient").slice(0, 120);
    }
    const { error } = await sb.from("mercury_settings").update({ commission_recipient_id: id || null, commission_recipient_name: name, updated_by: userId, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true });
  }

  if (action === "resplit") {
    const { data: ok, error } = await sb.rpc("resplit_ledger_row", { p_id: String(body.id || "") });
    if (error) return json({ ok: false, error: error.message }, 500);
    if (!ok) return json({ ok: false, error: "Only a payment that needs a look, with nothing paid out yet, can be split again." }, 409);
    await recordLedger();
    return json({ ok: true });
  }

  // A payout rejected or cancelled in Mercury: its money goes back into the next payout and its gigs
  // lose Paid Out.
  if (action === "void_payout") {
    // Void frees the payout's money for the next Send, which gets a NEW Mercury idempotency key -- so voiding
    // a payout Mercury still carries out pays the singer twice (2026-11-12 audit #6). Allowed only when no
    // money can have moved: it failed or never reached Mercury; a commission send Mercury reports rejected or
    // cancelled; or the owner forces it with a written reason (singer transfers have no status lookup in
    // Mercury's API, so the owner confirms in Mercury first).
    const { data: po } = await sb.from("monthly_payouts").select("id, kind, status, mercury_request_id, created_at").eq("id", String(body.id || "")).maybeSingle();
    if (!po) return json({ ok: false, error: "No such payout." }, 404);
    const stuck = po.status === "sending" && !po.mercury_request_id && Date.parse(po.created_at) < Date.now() - 15 * 60_000;
    let safe = po.status === "failed" && !po.mercury_request_id || stuck;
    let why = "";
    if (!safe && po.status === "sent" && po.kind === "commission" && po.mercury_request_id) {
      const r = await mercuryApi("GET", `/request-send-money/${encodeURIComponent(po.mercury_request_id)}`);
      const st = String(r.data?.status || "");
      safe = r.ok && (st === "rejected" || st === "cancelled");
      why = r.ok ? `Mercury says this transfer is ${st || "unknown"}.` : `Couldn't check it with Mercury (${mercuryError(r)}).`;
    }
    const reason = String(body.reason || "").trim().slice(0, 300);
    if (!safe) {
      const { data: me } = await sb.from("admin_users").select("role").eq("user_id", userId).maybeSingle();
      if (!(body.force === true && me?.role === "admin_ceo" && reason.length >= 5)) {
        return json({ ok: false, error: `This payout may already have been paid. ${why} Cancel or reject it in Mercury first; then only the owner can void it, with a reason.`.replace(/\s+/g, " ") }, 409);
      }
    }
    const { data: gigs, error } = await sb.rpc("void_month_payout", { p_id: po.id, p_by: userId });
    if (error) return json({ ok: false, error: error.message }, 500);
    if (reason) await sb.from("monthly_payouts").update({ error: `Voided by the owner: ${reason}` }).eq("id", po.id);
    for (const g of gigs || []) {
      const { data: row } = await sb.from("events").select("app_doc").eq("legacy_id", g.event_legacy_id).maybeSingle();
      const doc = row?.app_doc;
      if (!doc?.artistPaidOut) continue;
      await sb.rpc("patch_event_doc", { p_legacy_id: g.event_legacy_id, p_patch: { artistPaidOut: false, artistPaidOutDate: null },
        p_log: { ts: new Date().toISOString(), type: "system", text: "Mercury payout voided -- the singer's money goes into the next payout." } });
    }
    return json({ ok: true });
  }

  if (action === "pay_month") return json(await payMonth(String(body.month || ""), userId));

  if (action !== "sync") return json({ ok: false, error: "unknown action" }, 400);
  const out = await sync();
  await sb.from("mercury_sync_state").update({ last_run_at: new Date().toISOString(), last_error: out.error || null }).eq("id", 1);
  return json(out, out.ok ? 200 : 502);

  // ---- the month's payouts ----
  // Per payee, claim_month_payout (0079) claims every unpaid part that landed by the month's end and creates
  // the payout for exactly that amount, in one transaction under one lock; its id is Mercury's idempotency
  // key. So two presses (or two months) at once never send the same money, and a retry never moves it twice.
  async function payMonth(month: string, by: string | null): Promise<Any> {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return { ok: false, error: "Pick a month." };
    if (month >= nyDate(new Date()).slice(0, 7)) return { ok: false, error: "A month is paid out once it's over." };
    const { data: accts } = await sb.from("mercury_accounts").select("account_id, name, role, payee_profile_id").in("role", ["main", "payee"]);
    const main = (accts || []).find((a: Any) => a.role === "main");
    if (!main) return { ok: false, error: "Pick ASP's main account in Settings → Mercury first." };
    const { data: settings } = await sb.from("mercury_settings").select("commission_recipient_id, commission_recipient_name").eq("id", 1).maybeSingle();
    const destFor = (key: string) => key === "commission"
      ? (settings?.commission_recipient_id ? { id: settings.commission_recipient_id, name: settings.commission_recipient_name || "the commission account" } : null)
      : (() => { const a = (accts || []).find((x: Any) => x.role === "payee" && x.payee_profile_id === key); return a ? { id: a.account_id, name: a.name } : null; })();

    // Who has money waiting (the claim itself re-checks everything under the lock).
    const { data: rows } = await sb.from("money_ledger_parts").select("kind, payee_key, payee_name, ledger:money_ledger!inner(received_on, needs_review)")
      .is("payout_id", null).lte("ledger.received_on", monthEnd(month)).is("ledger.needs_review", null).limit(5000);
    const payees = new Map<string, { kind: string; name: string }>();
    for (const r of rows || []) if (!payees.has(r.payee_key)) payees.set(r.payee_key, { kind: r.kind, name: r.payee_key === "commission" ? "ASP commission" : (r.payee_name || "") });
    const { data: prior } = await sb.from("monthly_payouts").select("*").eq("month", month).neq("status", "voided");
    const stale = Date.now() - 5 * 60_000;
    const retry = (prior || []).filter((p: Any) => p.status === "failed" || (p.status === "sending" && Date.parse(p.created_at) < stale));
    const missing: string[] = [];
    const fresh = [...payees].filter(([key]) => !(prior || []).some((p: Any) => p.payee_key === key));
    for (const [key, x] of fresh) if (!destFor(key)) missing.push(key === "commission" ? "Pick where the commission goes (Settings → Mercury)." : `Pick ${x.name || "this singer"}'s Mercury account in Settings → Mercury.`);

    if (!mercuryCanMoveMoney() || mercurySandbox()) {
      // Test mode (and Mercury's sandbox): say what it would send; claim and record nothing.
      const { data: preview } = await sb.from("money_ledger_parts").select("payee_key, cents, ledger:money_ledger!inner(received_on, needs_review, event_legacy_id)")
        .is("payout_id", null).lte("ledger.received_on", monthEnd(month)).is("ledger.needs_review", null).limit(5000);
      const gigIds = [...new Set((preview || []).map((r: Any) => r.ledger?.event_legacy_id).filter(Boolean))];
      const { data: handPaid } = gigIds.length ? await sb.from("events").select("legacy_id").in("legacy_id", gigIds).eq("artist_paid_out", true) : { data: [] };
      const paidSet = new Set((handPaid || []).map((e: Any) => e.legacy_id));
      const tot = new Map<string, number>();
      for (const r of preview || []) {
        if (r.payee_key !== "commission" && paidSet.has(r.ledger?.event_legacy_id)) continue;   // the claim skips these too
        tot.set(r.payee_key, (tot.get(r.payee_key) || 0) + Number(r.cents || 0));
      }
      return { ok: true, test: true, missing, retry: retry.length,
        wouldSend: fresh.filter(([k]) => destFor(k) && (tot.get(k) || 0) > 0).map(([k, x]) => ({ name: x.name, cents: tot.get(k), to: destFor(k)!.name })) };
    }
    const results: Any[] = [];
    for (const [key, x] of fresh) {
      const dest = destFor(key);
      if (!dest) continue;
      const { data: claimed, error } = await sb.rpc("claim_month_payout", { p_month: month, p_payee_key: key, p_kind: x.kind, p_name: x.name, p_destination: dest.name, p_by: by });
      if (error) { results.push({ ok: false, name: x.name, error: error.message }); continue; }
      const c = claimed?.[0];
      if (!c) continue;   // nothing left to claim (already paid, or only a hand-paid gig's share)
      results.push(await sendPayout({ id: c.payout_id, month, kind: x.kind, payee_name: x.name, amount_cents: Number(c.amount_cents) }, dest, main));
    }
    for (const p of retry) {
      const dest = destFor(p.payee_key);
      if (dest) results.push(await sendPayout(p, dest, main));
    }
    await markPaidOutGigs(month);
    const failed = results.filter((r) => !r.ok);
    return { ok: !failed.length, sent: results.filter((r) => r.ok).length, failed, missing,
      error: failed.length ? failed.map((f) => `${f.name}: ${f.error}`).join(" · ") : undefined };
  }

  async function sendPayout(p: Any, dest: Any, main: Any): Promise<Any> {
    await sb.from("monthly_payouts").update({ status: "sending", error: null }).eq("id", p.id);
    const note = `ASP ${p.month} ${p.kind === "commission" ? "commission" : `payout — ${p.payee_name || ""}`}`.slice(0, 100);
    const call = (b: Any) => p.kind === "commission"
      ? mercuryApi("POST", `/account/${encodeURIComponent(main.account_id)}/request-send-money`, b)
      : mercuryApi("POST", "/request-transfer", b);
    const req = p.kind === "commission"
      ? { recipientId: dest.id, amount: p.amount_cents / 100, paymentMethod: "ach", idempotencyKey: p.id, note, externalMemo: note }
      : { sourceAccountId: main.account_id, destinationAccountId: dest.id, amount: p.amount_cents / 100, idempotencyKey: p.id, note };
    let r = await call(req);
    if (!r.ok && (r.status === 0 || r.status >= 500 || r.status === 429)) r = await call(req);
    if (!r.ok) {
      const msg = mercuryError(r);
      await sb.from("monthly_payouts").update({ status: "failed", error: msg }).eq("id", p.id).eq("status", "sending");
      return { ok: false, name: p.payee_name, error: msg };
    }
    await sb.from("monthly_payouts").update({ status: "sent", sent_at: new Date().toISOString(), destination: dest.name,
      mercury_request_id: r.data?.requestId || r.data?.id || null }).eq("id", p.id).eq("status", "sending");   // a void meanwhile stays voided
    if (p.kind === "share") { try { await sendStatement({ ...p, destination: dest.name }); } catch (err) { console.error("mercury statement", String(err)); } }
    return { ok: true, name: p.payee_name };
  }

  // The singer's statement, emailed once their monthly payout is sent (owner 2026-11-09: "Yes, email statement"):
  // each payment in it -- the gig, deposit or balance, the day it came in, ASP's commission and what they get.
  // On a gig with several singers ASP's commission on that payment is shared out in proportion to their shares.
  // Best effort: the money has moved either way; a singer with no email on file gets none.
  async function sendStatement(p: Any): Promise<void> {
    const { data: prof } = await sb.from("app_records").select("app_doc").eq("collection", "payee_profiles").eq("legacy_id", p.payee_key).maybeSingle();
    const artistRef = prof?.app_doc?.artistId;
    if (!artistRef) return;
    const { data: artist } = await sb.from("artists").select("name, email").or(`legacy_id.eq.${artistRef},id.eq.${artistRef}`).maybeSingle();
    if (!artist?.email) return;
    const { data: mine } = await sb.from("money_ledger_parts").select("ledger_id, cents, ledger:money_ledger!inner(event_legacy_id, kind, received_on)").eq("payout_id", p.id);
    if (!mine?.length) return;
    const ledgerIds = [...new Set(mine.map((m: Any) => m.ledger_id))];
    const { data: all } = await sb.from("money_ledger_parts").select("ledger_id, kind, cents").in("ledger_id", ledgerIds);
    const gigIds = [...new Set(mine.map((m: Any) => m.ledger.event_legacy_id))];
    const { data: gigs } = await sb.from("events").select("legacy_id, date, app_doc").in("legacy_id", gigIds);
    const gigOf = (id: string) => (gigs || []).find((g: Any) => g.legacy_id === id);
    const e = (x: unknown) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
    const day = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    let totYou = 0, totComm = 0;
    const rows = mine.sort((a: Any, b: Any) => String(a.ledger.received_on).localeCompare(String(b.ledger.received_on))).map((m: Any) => {
      const parts = (all || []).filter((x: Any) => x.ledger_id === m.ledger_id);
      const shares = parts.filter((x: Any) => x.kind === "share").reduce((t: number, x: Any) => t + Number(x.cents || 0), 0);
      const comm = parts.filter((x: Any) => x.kind === "commission").reduce((t: number, x: Any) => t + Number(x.cents || 0), 0);
      const myComm = shares > 0 ? Math.round(comm * Number(m.cents) / shares) : 0;
      totYou += Number(m.cents); totComm += myComm;
      const g = gigOf(m.ledger.event_legacy_id), doc = g?.app_doc || {};
      const what = [doc.type, doc.clientName].filter(Boolean).join(" · ") || m.ledger.event_legacy_id;
      const td = "padding:8px 6px;border-top:1px solid #E1E1E6;vertical-align:top;";
      return `<tr><td style="${td}">${e(g?.date ? day(g.date) : "")}<br/><span style="color:#67676D;font-size:12px;">${e(what)}</span></td><td style="${td}">${m.ledger.kind === "deposit" ? "Deposit" : "Balance"}<br/><span style="color:#67676D;font-size:12px;">in ${e(day(m.ledger.received_on))}</span></td><td style="${td}text-align:right;">${usd(Number(m.cents) + myComm)}</td><td style="${td}text-align:right;color:#67676D;">${usd(myComm)}</td><td style="${td}text-align:right;font-weight:600;">${usd(Number(m.cents))}</td></tr>`;
    }).join("");
    const monthName = new Date(p.month + "-01T00:00:00Z").toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    const th = "padding:6px;text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#9A9AA1;";
    const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#F5F4EF;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17171A;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;">
    <div style="padding:20px 24px 16px;border-bottom:1px solid #E3E3E8;">${emailHeaderHtml(artist.name)}</div>
    <div style="padding:24px;font-size:14px;line-height:1.55;">
      <p style="margin:0 0 6px;font-size:18px;font-weight:600;">Your ${e(monthName)} payout</p>
      <p style="margin:0 0 16px;color:#67676D;">${usd(totYou)} was sent to your account (${e(p.destination || "your Mercury account")}). Here is what it covers.</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums;">
        <tr><th style="${th}">Gig</th><th style="${th}">Payment</th><th style="${th}text-align:right;">Amount</th><th style="${th}text-align:right;">ASP commission</th><th style="${th}text-align:right;">You receive</th></tr>
        ${rows}
        <tr><td colspan="3" style="padding:10px 6px;border-top:2px solid #17171A;font-weight:700;">Total</td><td style="padding:10px 6px;border-top:2px solid #17171A;text-align:right;color:#67676D;">${usd(totComm)}</td><td style="padding:10px 6px;border-top:2px solid #17171A;text-align:right;font-weight:700;">${usd(totYou)}</td></tr>
      </table>
      <p style="margin:18px 0 0;color:#67676D;font-size:12.5px;">Payments are paid out the month after they come in, including deposits for gigs still ahead. Questions? Just reply to this email.</p>
    </div>
  </div></body></html>`;
    await sendRelayEmail(sb, { to: artist.email, subject: `ASP payout statement — ${monthName}`, html, brand: "asp" });
  }

  // A gig is Paid Out once each singer has been sent, in payouts, at least their whole share of it
  // (artistShares) -- a short balance doesn't count (owner 2026-11-04: "singer payout comes when we send
  // them the money"). Only gigs in this month's payouts are looked at. The gig's app_doc is the record;
  // the events trigger copies it to artist_paid_out and Realtime shows it in every open app.
  async function markPaidOutGigs(month: string): Promise<void> {
    const { data: mine } = await sb.from("money_ledger_parts").select("ledger:money_ledger!inner(event_legacy_id), payout:monthly_payouts!inner(month, status)")
      .eq("kind", "share").eq("payout.month", month).eq("payout.status", "sent").limit(5000);
    const gigs = [...new Set((mine || []).map((p: Any) => p.ledger?.event_legacy_id).filter(Boolean))];
    const today = nyDate(new Date());
    for (const gig of gigs) {
      const { data: row } = await sb.from("events").select("app_doc").eq("legacy_id", gig).maybeSingle();
      const doc = row?.app_doc;
      if (!doc || doc.artistPaidOut) continue;
      const owed = await artistShares(sb, gig, doc);
      if (!owed) continue;
      const { data: parts } = await sb.from("money_ledger_parts").select("payee_key, payee_name, cents, ledger:money_ledger!inner(event_legacy_id), payout:monthly_payouts(status, month)")
        .eq("kind", "share").eq("ledger.event_legacy_id", gig);
      const sentTo = new Map<string, number>();
      for (const p of parts || []) if (p.payout?.status === "sent") sentTo.set(p.payee_key, (sentTo.get(p.payee_key) || 0) + Number(p.cents || 0));
      const need = new Map<string, number>();
      for (const x of owed) need.set(x.payeeProfileId, (need.get(x.payeeProfileId) || 0) + x.cents);
      if ([...need].some(([k, c]) => c > 0 && (sentTo.get(k) || 0) < c)) continue;
      const months = [...new Set((parts || []).filter((p: Any) => p.payout?.status === "sent").map((p: Any) => p.payout.month))].join(", ");
      const who = [...sentTo].map(([k, c]) => `${(parts || []).find((p: Any) => p.payee_key === k)?.payee_name || "artist"} ${usd(c)}`).join(", ");
      const { error } = await sb.rpc("patch_event_doc", { p_legacy_id: gig, p_patch: { artistPaidOut: true, artistPaidOutDate: today },
        p_log: { ts: new Date().toISOString(), type: "success", text: `Paid out in the ${months} Mercury payout: ${who}.` } });
      if (error) console.error("mercury: mark paid out", gig, error.message);
    }
  }

  // ---- the money ledger: each payment that reached ASP, once, with its split ----
  async function recordLedger(): Promise<number> {
    const found: Any[] = [];
    const { data: items } = await sb.from("inbox_items").select("gmail_message_id, event_legacy_id, money, received_at").eq("mailbox_email", "mercury").not("money_applied_at", "is", null);
    for (const it of items || []) {
      const kind = it.money?.match?.kind, gig = it.event_legacy_id || it.money?.match?.ref;
      if ((kind !== "deposit" && kind !== "balance") || !gig) continue;
      const role = it.money?.mercury?.account_role;
      found.push({ source: "mercury", source_id: it.gmail_message_id, gig, kind, cents: Number(it.money?.amount_cents) || 0,
        on: it.received_at ? nyDate(new Date(it.received_at)) : String(it.money?.date || "").slice(0, 10), went_to: role === "payee" ? "singer" : "main" });
    }
    const { data: prs } = await sb.from("payment_requests").select("id, kind, event_legacy_id, contract_legacy_id, amount_cents, paid_at, payout_via, created_by")
      .eq("pay_status", "paid").in("kind", ["contract_deposit", "event_balance"]).is("refunded_at", null).is("disputed_at", null);
    // A Stripe payment refunded or disputed after it was saved: hold its unpaid money for a look.
    const { data: undone } = await sb.from("payment_requests").select("id").in("kind", ["contract_deposit", "event_balance"]).or("refunded_at.not.is.null,disputed_at.not.is.null");
    if (undone?.length) await sb.from("money_ledger").update({ needs_review: "This payment was refunded or disputed in Stripe -- check it before anything is paid out." })
      .eq("source", "stripe").in("source_id", undone.map((u: Any) => u.id)).is("needs_review", null);
    for (const p of prs || []) {
      // Test-harness payments are for gigs that never reach the events table, so they drop out below.
      let gig = p.event_legacy_id;
      if (!gig && p.contract_legacy_id) {
        const { data: c } = await sb.from("app_records").select("app_doc").eq("collection", "contracts").eq("legacy_id", p.contract_legacy_id).maybeSingle();
        gig = c?.app_doc?.leadId || null;
      }
      if (!gig) continue;
      found.push({ source: "stripe", source_id: p.id, gig, kind: p.kind === "event_balance" ? "balance" : "deposit", cents: Number(p.amount_cents) || 0,
        on: p.paid_at ? nyDate(new Date(p.paid_at)) : "", went_to: p.payout_via === "stripe_connect" ? "singer_stripe" : "stripe" });
    }
    // Oldest first, so a gig's deposit is split before its balance.
    found.sort((x, y) => String(x.on).localeCompare(String(y.on)) || (x.kind === "deposit" ? -1 : 1));
    let n = 0;
    for (const f of found) {
      if (!(f.cents > 0) || !f.on || String(f.gig).startsWith("EV-TEST-")) continue;
      const { data: exists } = await sb.from("money_ledger").select("id").eq("source", f.source).eq("source_id", f.source_id).maybeSingle();
      if (exists) continue;
      const { data: evRow } = await sb.from("events").select("app_doc").eq("legacy_id", f.gig).maybeSingle();
      const ev = evRow?.app_doc;
      if (!ev) continue;
      if (f.kind === "balance" ? !ev.balanceReceived : !(ev.depositReceived || ev.balanceReceived)) continue;   // not recorded on the gig yet
      let parts: Any[] = [], review: string | null = null, note: string | null = null;
      if (f.went_to === "singer" || f.went_to === "singer_stripe") {
        // Nothing to move; ASP's commission comes out of the gig's next payment that reaches ASP instead.
        note = "Went straight to the singer's own account -- nothing to move.";
      } else {
        // Across all of a gig's payments: ASP's commission comes out first, then each singer's share up to
        // what they're owed; anything over (a card fee, an overpayment) stays with ASP. So a deposit
        // bigger than the commission already carries part of the singers' money, and a balance that
        // isn't all theirs keeps ASP's part.
        const shares = await artistShares(sb, f.gig, ev);
        const extras = (Array.isArray(ev.additionalArtists) ? ev.additionalArtists : []).filter((x: Any) => x && x.artistId);
        const commissionTotal = Math.round(((Number(ev.commission) || 0) + extras.reduce((t: number, x: Any) => t + (Number(x.aspCut) || 0), 0)) * 100);
        const { data: before } = await sb.from("money_ledger_parts").select("kind, payee_key, cents, ledger:money_ledger!inner(event_legacy_id)").eq("ledger.event_legacy_id", f.gig);
        const had = (key: string) => (before || []).filter((x: Any) => x.payee_key === key).reduce((t: number, x: Any) => t + Number(x.cents || 0), 0);
        let left = f.cents;
        const toAsp = Math.min(left, Math.max(0, commissionTotal - had("commission")));
        left -= toAsp;
        let extraToAsp = 0;
        if (left > 0) {
          if (!shares) review = "No payee profile for a singer on this gig -- add it, then press Re-split.";
          else {
            const owedNow = new Map<string, { name: string; cents: number }>();
            for (const x of shares) { const o = owedNow.get(x.payeeProfileId) || { name: x.name, cents: 0 }; o.cents += x.cents; owedNow.set(x.payeeProfileId, o); }
            for (const [key, o] of owedNow) {
              const give = Math.min(left, Math.max(0, o.cents - had(key)));
              if (give > 0) { parts.push({ kind: "share", payee_key: key, payee_name: o.name || null, cents: give }); left -= give; }
            }
            extraToAsp = left;
          }
        }
        if (!review && toAsp + extraToAsp > 0) parts.push({ kind: "commission", payee_key: "commission", payee_name: "ASP commission", cents: toAsp + extraToAsp });
        if (review) parts = [];
      }
      const { data: row, error } = await sb.from("money_ledger").insert({ source: f.source, source_id: f.source_id, event_legacy_id: f.gig, kind: f.kind,
        received_on: f.on, amount_cents: f.cents, went_to: f.went_to, note, needs_review: review }).select("id").maybeSingle();
      if (error || !row) { if (error && !/duplicate/.test(error.message)) console.error("ledger", error.message); continue; }
      if (parts.length) {
        const { error: pe } = await sb.from("money_ledger_parts").insert(parts.map((p) => ({ ...p, ledger_id: row.id })));
        if (pe) { console.error("ledger parts", pe.message); await sb.from("money_ledger").delete().eq("id", row.id); continue; }
      }
      n++;
    }
    return n;
  }

  async function sync(): Promise<Any> {
    // 1. The accounts (names only; never the account numbers).
    const ar = await mercuryApi("GET", "/accounts");
    if (!ar.ok) return { ok: false, error: `accounts: ${mercuryError(ar)}` };
    const now = new Date().toISOString();
    const listed = (ar.data?.accounts || []).filter((a: Any) => a?.id && a.type !== "external" && a.type !== "recipient");
    for (const a of listed) {
      await sb.from("mercury_accounts").upsert({ account_id: a.id, name: String(a.nickname || a.name || "").slice(0, 120), kind: a.kind || null, status: a.status || null, last_seen_at: now, updated_at: now },
        { onConflict: "account_id" });
    }
    const { data: accts } = await sb.from("mercury_accounts").select("account_id, name, role, payee_profile_id");
    const acctById = new Map((accts || []).map((a: Any) => [a.account_id, a]));
    const { data: anyTxn } = await sb.from("mercury_transactions").select("id").limit(1);
    const since = new Date(Date.now() - (anyTxn?.length ? OVERLAP_DAYS : FIRST_DAYS) * 86_400_000).toISOString().slice(0, 10);

    // What every recent and upcoming gig still owes, the same figures as the app (_shared/connect.ts).
    const from = new Date(Date.now() - 180 * 86_400_000).toISOString().slice(0, 10);
    const { data: evs } = await sb.from("events").select("legacy_id, client_name, app_doc").gte("date", from).limit(1000);
    const { data: recs } = await sb.from("app_records").select("collection, app_doc").in("collection", ["contracts", "invoices"]);
    const contracts = (recs || []).filter((r: Any) => r.collection === "contracts").map((r: Any) => r.app_doc).filter(Boolean);
    const gigs = (evs || []).map((e: Any) => {
      const ev = e.app_doc || {}, cts = contracts.filter((c: Any) => c.leadId === e.legacy_id);
      return { id: e.legacy_id, ev, names: nameTokens(`${e.client_name || ""} ${ev.clientName || ""}`),
        deposit: ev.depositReceived ? 0 : depositCentsOf(ev, cts), balance: ev.balanceReceived ? 0 : clientOwedCentsOf(ev, cts) };
    });
    const invTotal = (inv: Any) => Math.round((inv.items || []).reduce((s: number, it: Any) => s + (Number(it.amount) || 0), 0) * 100);
    const invoices = (recs || []).filter((r: Any) => r.collection === "invoices" && r.app_doc?.status === "open").map((r: Any) => r.app_doc);

    // 2. Every incoming credit on each account.
    let read = 0, recorded = 0;
    for (const a of listed) {
      if ((acctById.get(a.id) as Any)?.role === "ignore") continue;
      const tr = await mercuryApi("GET", `/account/${encodeURIComponent(a.id)}/transactions?start=${since}&limit=500&order=asc`);
      if (!tr.ok) return { ok: false, error: `transactions (${a.name}): ${mercuryError(tr)}` };
      for (const t of tr.data?.transactions || []) {
        const cents = Math.round(Number(t.amount) * 100);
        if (!t.id || !(cents > 0) || NOT_CLIENT_KINDS.includes(t.kind)) continue;
        read++;
        const memo = [t.externalMemo, t.bankDescription, t.note].filter(Boolean).join(" · ").slice(0, 300);
        const { data: prev } = await sb.from("mercury_transactions").select("inbox_item_id").eq("id", t.id).maybeSingle();
        await sb.from("mercury_transactions").upsert({ id: t.id, account_id: a.id, amount_cents: cents, kind: t.kind || null, status: t.status || null,
          counterparty: String(t.counterpartyNickname || t.counterpartyName || "").slice(0, 200), memo, posted_at: t.postedAt || null, created_at: t.createdAt || null }, { onConflict: "id" });
        // Only money that has landed, once.
        if (prev?.inbox_item_id || t.status !== "sent") continue;
        const item = await recordCredit(t, cents, memo, acctById.get(a.id) as Any, a);
        if (item) { await sb.from("mercury_transactions").update({ inbox_item_id: item }).eq("id", t.id); recorded++; }
      }
    }

    // 3. Every recorded payment's split, saved once (paid out monthly, never here).
    const ledgered = await recordLedger();
    return { ok: true, accounts: listed.length, credits: read, recorded, ledgered };

    // A credit -> its inbox "Money in" row. Stripe's own payouts are lumps of many payments: shown, not matched.
    async function recordCredit(t: Any, cents: number, memo: string, acct: Any, a: Any): Promise<string | null> {
      const payer = String(t.counterpartyNickname || t.counterpartyName || "");
      const method = KIND_METHOD[t.kind] || "bank transfer";
      const stripePayout = /stripe/i.test(payer);
      let match: Any = null, gigId: string | null = null, why = "";
      if (!stripePayout) {
        const who = new Set(nameTokens(`${payer} ${memo}`));
        const named = (g: Any) => g.names.some((n: string) => who.has(n));
        const exact = [
          ...gigs.filter((g) => g.deposit > 0 && g.deposit === cents).map((g) => ({ kind: "deposit", g })),
          ...gigs.filter((g) => Number.isFinite(g.balance) && g.balance > 0 && g.balance === cents && g.ev.depositReceived).map((g) => ({ kind: "balance", g })),
        ];
        const exactInv = invoices.filter((inv: Any) => invTotal(inv) === cents);
        const pick = exact.length + exactInv.length === 1 ? exact[0] : exact.filter((x) => named(x.g)).length === 1 && !exactInv.length ? exact.find((x) => named(x.g)) : null;
        if (pick) {
          match = { kind: pick.kind, ref: pick.g.id, due_cents: cents, exact: true }; gigId = pick.g.id;
          why = `${usd(cents)} is exactly the ${pick.kind} due${named(pick.g) ? ` and the payer's name fits` : ""}`;
        } else if (!exact.length && exactInv.length === 1) {
          match = { kind: "invoice", ref: exactInv[0].id, due_cents: cents, exact: true }; why = `${usd(cents)} is exactly invoice ${exactInv[0].id}`;
        } else {
          // Not an exact amount: the one open gig the payer's name fits, as a partial payment to check.
          const fits = gigs.filter((g) => named(g) && (g.deposit > 0 || (Number.isFinite(g.balance) && g.balance > 0)));
          if (fits.length === 1) {
            const g = fits[0], kind = g.deposit > 0 ? "deposit" : "balance", due = kind === "deposit" ? g.deposit : g.balance;
            match = { kind, ref: g.id, due_cents: due, exact: false }; gigId = g.id; why = `the payer's name fits ${g.id}; the amount isn't what's due`;
          } else why = exact.length > 1 ? `${exact.length} gigs are due exactly ${usd(cents)} -- pick the right one` : "no gig or invoice is due this amount";
        }
      }
      const where = acct?.role === "payee" ? `${a.nickname || a.name} (a singer's account)` : String(a.nickname || a.name || "Mercury");
      const { data, error } = await sb.from("inbox_items").upsert({
        mailbox_email: "mercury", gmail_message_id: t.id, gmail_thread_id: null,
        received_at: t.postedAt || t.createdAt || new Date().toISOString(),
        from_addr: payer.slice(0, 300), subject: `${usd(cents)} received in ${where}`.slice(0, 300), snippet: memo.slice(0, 400),
        kind: "payment_notice", summary: stripePayout ? "Stripe payout (the card and bank payments it adds up are already recorded from Stripe)." : `${method} from ${payer || "unknown"}.`,
        event_legacy_id: gigId, match_note: why.slice(0, 300), extracted: {},
        money: { amount_cents: cents, payer: payer.slice(0, 200), method, date: String(t.postedAt || t.createdAt || "").slice(0, 10), memo, bank_verified: true, bank: "Mercury", match,
          mercury: { transaction_id: t.id, account_id: a.id, account_role: acct?.role || null } },
        status: stripePayout ? "dismissed" : "new",
      }, { onConflict: "mailbox_email,gmail_message_id", ignoreDuplicates: true }).select("id");
      if (error) { console.error("mercury inbox", error.message); return null; }
      if (data?.[0]?.id) return data[0].id;
      const { data: had } = await sb.from("inbox_items").select("id").eq("mailbox_email", "mercury").eq("gmail_message_id", t.id).maybeSingle();
      return had?.id || null;
    }
  }
});
