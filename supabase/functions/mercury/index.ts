// Mercury: money in from the bank, and each singer's share moved into their own account (migration
// 0067, ops/MERCURY_SETUP.md; owner 2026-10-27: "create sub accounts that the money can automatically
// get split up so my payouts are easier").
//
//   POST { action: "sync" }                                    cron (x-cron-secret) or an admin
//     1. reads ASP's Mercury accounts and every incoming credit on them (read-only on the bank);
//     2. each settled credit becomes an inbox "Money in" row (bank 'Mercury', bank-verified), matched to
//        a gig's deposit or balance or an open invoice by amount and the payer's name -- the app records
//        exact matches on its own, exactly like a bank's email alert;
//     3. once a gig's balance paid into ASP's MAIN account (or to ASP's own Stripe, payout_via
//        'mercury') is recorded, each artist's whole share is proposed as a transfer to their account.
//   POST { action: "status" }                                  admin: accounts, transfers, last run
//   POST { action: "assign", accountId, role, payeeProfileId } owner/COO/bookkeeping: main / a singer's / ignore
//   POST { action: "approve", id } | { action: "cancel", id }  owner/COO/bookkeeping: move or drop one
//
// Money moves only on an approval (MERCURY_AUTO_SPLIT=yes lets the sync approve them itself, later),
// and only on Mercury's sandbox or with MERCURY_LIVE=yes; otherwise an approval is recorded as 'test'.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";
import { artistShares, clientOwedCentsOf, depositCentsOf } from "../_shared/connect.ts";
import { mercuryApi, mercuryCanMoveMoney, mercuryConfigured, mercuryError, mercurySandbox } from "../_shared/mercury.ts";

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
const nameTokens = (s: string) => String(s || "").toLowerCase().split(/[^a-z]+/).filter((t) => t.length >= 3 && !["the", "and", "llc", "inc", "family"].includes(t));

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
    const [{ data: accounts }, { data: transfers }, { data: state }] = await Promise.all([
      sb.from("mercury_accounts").select("account_id, name, kind, status, role, payee_profile_id").order("name"),
      sb.from("mercury_transfers").select("*").order("created_at", { ascending: false }).limit(100),
      sb.from("mercury_sync_state").select("last_run_at, last_error").eq("id", 1).maybeSingle(),
    ]);
    return json({ ok: true, configured: mercuryConfigured(), sandbox: mercuryConfigured() && mercurySandbox(), canMoveMoney: mercuryConfigured() && mercuryCanMoveMoney(),
      accounts: accounts || [], transfers: transfers || [], lastRunAt: state?.last_run_at || null, lastError: state?.last_error || null });
  }
  if (!mercuryConfigured()) return json({ ok: false, error: "Mercury is not connected yet (MERCURY_API_TOKEN)." }, 503);

  // Which account gets whose money, and moving it: the owner, COO or bookkeeping only.
  if (["assign", "approve", "cancel"].includes(action)) {
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

  if (action === "approve" || action === "cancel") {
    const id = String(body.id || "");
    if (action === "cancel") {
      const { data, error } = await sb.from("mercury_transfers").update({ status: "cancelled", decided_by: userId, decided_at: new Date().toISOString() })
        .eq("id", id).in("status", ["proposed", "failed"]).select("id");
      if (error) return json({ ok: false, error: error.message }, 500);
      return data?.length ? json({ ok: true }) : json({ ok: false, error: "It was already sent or cancelled." }, 409);
    }
    return json(await sendTransfer(id, userId));
  }

  if (action !== "sync") return json({ ok: false, error: "unknown action" }, 400);
  const out = await sync();
  await sb.from("mercury_sync_state").update({ last_run_at: new Date().toISOString(), last_error: out.error || null }).eq("id", 1);
  return json(out, out.ok ? 200 : 502);

  // ---- money between ASP's own accounts ----
  async function sendTransfer(id: string, by: string | null): Promise<Any> {
    // Claim it (one approval wins); a failed one may be approved again -- the same idempotency key
    // (the row's id) means Mercury never moves it twice.
    const { data: rows, error } = await sb.from("mercury_transfers").update({ status: "sending", decided_by: by, decided_at: new Date().toISOString(), error: null })
      .eq("id", id).in("status", ["proposed", "failed"]).select("*");
    if (error) return { ok: false, error: error.message };
    const t = rows?.[0];
    if (!t) return { ok: false, error: "It was already sent or cancelled." };
    const fail = async (msg: string, status = "failed") => {
      await sb.from("mercury_transfers").update({ status, error: msg }).eq("id", id);
      return { ok: false, error: msg };
    };
    const { data: accts } = await sb.from("mercury_accounts").select("account_id, name, role, payee_profile_id").in("role", ["main", "payee"]);
    const main = (accts || []).find((a: Any) => a.role === "main");
    const dest = (accts || []).find((a: Any) => a.role === "payee" && a.payee_profile_id === t.payee_profile_id);
    if (!main) return fail("Pick ASP's main account in Settings → Mercury first.", "proposed");
    if (!dest) return fail(`Pick ${t.payee_name || "this payee"}'s Mercury account in Settings → Mercury first.`, "proposed");
    const note = `ASP ${t.event_legacy_id} — ${t.payee_name || "artist"} share`.slice(0, 100);
    if (!mercuryCanMoveMoney()) {
      await sb.from("mercury_transfers").update({ status: "test", note: `Test mode: would have moved ${usd(t.amount_cents)} from ${main.name} to ${dest.name}.` }).eq("id", id);
      return { ok: true, test: true };
    }
    const req = { sourceAccountId: main.account_id, destinationAccountId: dest.account_id, amount: t.amount_cents / 100, idempotencyKey: t.id, note };
    // "Transfer Money with Approval" (owner 2026-10-29): the token needs no fixed-IP list, and Mercury holds
    // the move until someone approves it in Mercury (not the user who made the token).
    let r = await mercuryApi("POST", "/request-transfer", req);
    if (!r.ok && (r.status === 0 || r.status >= 500 || r.status === 429)) r = await mercuryApi("POST", "/request-transfer", req);
    if (!r.ok) return fail(mercuryError(r));
    await sb.from("mercury_transfers").update({ status: "sent", sent_at: new Date().toISOString(), mercury_debit_id: r.data?.requestId || null,
      note: `${usd(t.amount_cents)} from ${main.name} to ${dest.name} is waiting for approval in Mercury.` }).eq("id", id);
    return { ok: true };
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

    // 3. Shares owed to artists from balances paid into ASP's own money.
    const proposed = await proposeShares(acctById);
    let sent = 0;
    if (Deno.env.get("MERCURY_AUTO_SPLIT") === "yes") {
      const { data: todo } = await sb.from("mercury_transfers").select("id").eq("status", "proposed").limit(25);
      for (const t of todo || []) if ((await sendTransfer(t.id, null)).ok) sent++;
    }
    return { ok: true, accounts: listed.length, credits: read, recorded, proposed, sent };

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

  // A gig's balance that landed in ASP's own money -- a Mercury credit into the MAIN account matched to
  // the balance, or an online payment to ASP's Stripe (payout_via 'mercury') -- once the gig is recorded
  // paid: each artist's whole share (fee less commission plus charges; ASP keeps its cut and the card
  // fee) is proposed for their own account. Once per payment and artist (unique key).
  async function proposeShares(acctById: Map<unknown, unknown>): Promise<number> {
    const sources: { source: string; id: string; gig: string }[] = [];
    const { data: items } = await sb.from("inbox_items").select("gmail_message_id, event_legacy_id, money").eq("mailbox_email", "mercury")
      .eq("money->match->>kind", "balance").not("money_applied_at", "is", null).gte("created_at", new Date(Date.now() - 120 * 86_400_000).toISOString());
    for (const it of items || []) {
      const acct = acctById.get(it.money?.mercury?.account_id) as Any;
      if (acct?.role === "main" && it.money?.match?.ref) sources.push({ source: "mercury", id: it.gmail_message_id, gig: it.money.match.ref });
    }
    const { data: prs } = await sb.from("payment_requests").select("id, event_legacy_id").eq("kind", "event_balance").eq("pay_status", "paid").eq("payout_via", "mercury");
    for (const p of prs || []) if (p.event_legacy_id && !p.event_legacy_id.startsWith("EV-TEST-")) sources.push({ source: "stripe", id: p.id, gig: p.event_legacy_id });
    let n = 0;
    for (const s of sources) {
      const { data: had } = await sb.from("mercury_transfers").select("id").eq("source", s.source).eq("source_id", s.id).limit(1);
      if (had?.length) continue;
      const { data: evRow } = await sb.from("events").select("app_doc").eq("legacy_id", s.gig).maybeSingle();
      const ev = evRow?.app_doc;
      if (!ev?.balanceReceived) continue;   // the office hasn't recorded it yet
      const parts = await artistShares(sb, s.gig, ev);
      if (!parts) { console.error("mercury: no shares for", s.gig); continue; }
      const rows = parts.filter((p) => p.cents > 0).map((p) => ({ event_legacy_id: s.gig, source: s.source, source_id: s.id, payee_profile_id: p.payeeProfileId, payee_name: p.name || null, amount_cents: p.cents,
        note: `${ev.clientName || ""} ${ev.date || ""}: share of the balance${ev.depositReceived ? " (the deposit ASP received covers its commission)" : ""}`.trim().slice(0, 300) }));
      if (!rows.length) continue;
      const { error } = await sb.from("mercury_transfers").upsert(rows, { onConflict: "source,source_id,payee_profile_id", ignoreDuplicates: true });
      if (error) console.error("mercury propose", error.message); else n += rows.length;
    }
    return n;
  }
});
