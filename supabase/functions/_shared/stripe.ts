// Stripe for the client payment link (migration 0056, ops/STRIPE_SETUP.md). Plain fetch against the
// REST API -- no SDK -- so nothing extra is bundled into every function.
//
// Function Secrets: STRIPE_SECRET_KEY (sk_test_… / sk_live_…), STRIPE_PUBLISHABLE_KEY (pk_…, shown to
// the client's browser), STRIPE_WEBHOOK_SECRET (whsec_…, for stripe-webhook).
import { serviceClient } from "./auth.ts";
import { sendRelayEmail } from "./mail.ts";
import { brandFor, brandLogoHtml } from "./config.ts";

export function stripeConfigured(): boolean {
  return !!(Deno.env.get("STRIPE_SECRET_KEY") && Deno.env.get("STRIPE_PUBLISHABLE_KEY"));
}
export function stripeMode(): "live" | "test" | null {
  const k = Deno.env.get("STRIPE_SECRET_KEY") || "";
  return k.startsWith("sk_live_") || k.startsWith("rk_live_") ? "live" : k ? "test" : null;
}

// Stripe's form encoding: nested objects as a[b]=c, arrays as a[0]=x.
function formEncode(obj: Record<string, unknown>, prefix = "", out = new URLSearchParams()): URLSearchParams {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => typeof x === "object" ? formEncode(x as Record<string, unknown>, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(x)));
    else if (typeof v === "object") formEncode(v as Record<string, unknown>, key, out);
    else out.append(key, String(v));
  }
  return out;
}

// deno-lint-ignore no-explicit-any
export type StripeResult = { ok: boolean; status: number; data: any };
export async function stripeApi(method: "GET" | "POST", path: string, params?: Record<string, unknown>, idempotencyKey?: string): Promise<StripeResult> {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) return { ok: false, status: 500, data: { error: { message: "Stripe is not configured" } } };
  const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
  let body: string | undefined;
  if (method === "POST") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = formEncode(params || {}).toString();
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  }
  try {
    const resp = await fetch(`https://api.stripe.com/v1${path}`, { method, headers, body });
    return { ok: resp.ok, status: resp.status, data: await resp.json().catch(() => ({})) };
  } catch (err) {
    return { ok: false, status: 502, data: { error: { message: String(err) } } };
  }
}

// The card fee. Only a CREDIT card is ever charged one: debit, prepaid and unknown cards and bank
// transfers are not (card-network rules forbid surcharging debit and prepaid). Capped at 3% here too.
export function cardFeeCents(amountCents: number, feeBps: number, method: string, funding: string | null): number {
  if (method !== "card" || funding !== "credit") return 0;
  return Math.round(amountCents * Math.min(Math.max(feeBps, 0), 300) / 10000);
}

// Verifies a webhook's Stripe-Signature header ("t=…,v1=…[,v1=…]"): HMAC-SHA256 of "<t>.<body>"
// with the endpoint secret, and t within 5 minutes (so a captured delivery can't be replayed later).
export async function verifyStripeSignature(rawBody: string, header: string | null, secret: string, toleranceSec = 300): Promise<boolean> {
  if (!header || !secret) return false;
  const parts = header.split(",").map((p) => p.split("=", 2) as [string, string]);
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !sigs.length || !/^\d+$/.test(t)) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${rawBody}`)));
  const expected = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => timingSafeEqual(s, expected));
}
function timingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function dollars(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// Sends through the app's one mail path (_shared/mail.ts: Resend, else the Apps Script relay) as the
// brand's sender. Never throws: a failed email is logged, the payment/signature is already recorded.
export async function relay(to: string, subject: string, html: string, _fromName: string, _replyTo: string | null, brandKey?: string): Promise<boolean> {
  const out = await sendRelayEmail(serviceClient(), { to, subject, html, brand: brandKey });
  if (!out.ok) console.error("email failed", subject, out.error);
  return out.ok;
}

const isTestRow = (r: { contract_legacy_id?: string | null; invoice_legacy_id?: string | null }) =>
  (r.contract_legacy_id || "").startsWith("CT-TEST-") || (r.invoice_legacy_id || "").startsWith("INV-TEST-");

function methodLabel(r: { pay_method: string | null; card_brand: string | null; card_funding: string | null; pay_last4: string | null }): string {
  if (r.pay_method === "us_bank_account") return `bank account${r.pay_last4 ? " ending " + r.pay_last4 : ""}`;
  const brand = r.card_brand ? r.card_brand.charAt(0).toUpperCase() + r.card_brand.slice(1) : "Card";
  return `${brand} ${r.card_funding === "credit" ? "credit" : r.card_funding === "debit" ? "debit" : ""} card${r.pay_last4 ? " ending " + r.pay_last4 : ""}`.replace(/\s+/g, " ");
}

// One PaymentIntent, as Stripe reports it now -> the payment link's state. Called by client-pay right
// after a charge and by stripe-webhook; safe to run any number of times. The first call that sees the
// money arrive records it (paid_at, the payments ledger, the receipt and the office notice) -- the
// conditional update makes exactly one caller do that. Database errors throw, so the webhook answers
// 500 and Stripe retries. (The gig's activity-log line is written by the office app when it marks the
// deposit received: a server-written line would be overwritten by the app's own write moments later.)
// deno-lint-ignore no-explicit-any
export async function recordPaymentIntent(sb: any, pi: any): Promise<void> {
  const requestId = pi?.metadata?.payment_request_id;
  if (!requestId) return;
  const { data: r, error: loadErr } = await sb.from("payment_requests").select("*").eq("id", requestId).maybeSingle();
  if (loadErr) throw new Error(`load payment link: ${loadErr.message}`);
  if (!r) return;
  const now = new Date().toISOString();
  if (r.payment_intent_id && r.payment_intent_id !== pi.id) {
    // An older attempt's intent: only money moving still counts. A bank transfer from it that's
    // processing becomes the link's attempt (so nothing else can charge meanwhile).
    if (pi.status === "processing") {
      const { error } = await sb.from("payment_requests").update({ pay_status: "processing", processing_at: now, payment_intent_id: pi.id, attempt_started_at: null })
        .eq("id", r.id).in("pay_status", ["open", "failed"]);
      if (error) throw new Error(`record older processing: ${error.message}`);
      return;
    }
    if (pi.status !== "succeeded") return;
  }
  if (pi.status === "processing") {
    const { error } = await sb.from("payment_requests").update({ pay_status: "processing", processing_at: r.processing_at || now, attempt_started_at: null, failure_message: null })
      .eq("id", r.id).in("pay_status", ["open", "failed", "processing"]);
    if (error) throw new Error(`record processing: ${error.message}`);
    return;
  }
  if (pi.status === "requires_payment_method" || pi.status === "canceled") {
    if (r.payment_intent_id !== pi.id) return;
    const msg = pi.last_payment_error?.message || (pi.status === "canceled" ? "The payment was cancelled." : "The payment didn't go through.");
    // Only while it's still the link's current attempt (a cancelled earlier attempt mustn't mark a
    // newer one failed or release its claim).
    const { error } = await sb.from("payment_requests").update({ pay_status: "failed", failed_at: now, failure_message: String(msg).slice(0, 300), attempt_started_at: null })
      .eq("id", r.id).eq("payment_intent_id", pi.id).in("pay_status", ["open", "processing", "failed"]);
    if (error) throw new Error(`record failure: ${error.message}`);
    return;
  }
  if (pi.status !== "succeeded") return;

  const total = Number(pi.amount_received || pi.amount) || 0;
  const fee = Number(pi.metadata?.fee_cents) || 0;
  const { data: won, error: wonErr } = await sb.from("payment_requests").update({
    pay_status: "paid", paid_at: now, total_cents: total, fee_cents: fee, payment_intent_id: pi.id,
    attempt_started_at: null, failure_message: null,
    pay_method: pi.metadata?.pay_method || r.pay_method, card_brand: pi.metadata?.card_brand || r.card_brand,
    card_funding: pi.metadata?.card_funding || r.card_funding, pay_last4: pi.metadata?.last4 || r.pay_last4,
  }).eq("id", r.id).is("paid_at", null).select("*");
  if (wonErr) throw new Error(`record payment: ${wonErr.message}`);
  const p = won?.[0];
  if (!p) {
    // Already recorded. A DIFFERENT successful charge for the same link means the client paid twice:
    // never silent -- it goes in the ledger for review and the office is told to refund one. The same
    // charge again: make sure its ledger row exists (an earlier insert may have failed).
    const { data: cur, error: curErr } = await sb.from("payment_requests").select("*").eq("id", r.id).single();
    if (curErr) throw new Error(`reload payment link: ${curErr.message}`);
    if (isTestRow(cur)) return;
    if (cur.payment_intent_id !== pi.id) await reportSecondCharge(sb, cur, pi);
    else await ledgerInsert(sb, cur, pi);
    return;
  }
  if (isTestRow(p)) return;
  // Another link for the same contract/invoice was already paid: this is a second payment.
  const sibKey = p.kind === "contract_deposit" ? ["contract_legacy_id", p.contract_legacy_id, "contract_created_at", p.contract_created_at]
    : ["invoice_legacy_id", p.invoice_legacy_id, "invoice_created_at", p.invoice_created_at];
  const { data: paidSib, error: sibErr } = await sb.from("payment_requests").select("*").eq(sibKey[0], sibKey[1]).eq(sibKey[2], sibKey[3])
    .neq("id", p.id).lt("paid_at", p.paid_at).order("paid_at").limit(1);   // the EARLIER payment stands
  if (sibErr) throw new Error(`check other links: ${sibErr.message}`);
  if (paidSib?.length) { await reportSecondCharge(sb, paidSib[0], pi); return; }

  const what = p.kind === "contract_deposit" ? `deposit for contract ${p.contract_legacy_id}` : `invoice ${p.invoice_legacy_id}`;

  // The receipt (with the fee on its own line, as card rules require) and the office notice.
  const brand = await brandFor(sb, p.brand_key || undefined);
  const rows = [[p.description, dollars(p.amount_cents)], ...(fee ? [["Credit card fee", dollars(fee)]] : []), ["Total paid", dollars(total)]];
  const receipt = `<div style="max-width:520px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14px;color:#17171A;">
<div style="padding-bottom:14px;border-bottom:2px solid #17171A;margin-bottom:18px;">${brandLogoHtml(200)}</div>
<p style="font-size:18px;font-weight:600;margin:0 0 4px;">Payment received — thank you!</p>
<p style="color:#67676D;margin:0 0 16px;">${escapeHtml(brand.senderName)} received your payment on ${escapeHtml(new Date(now).toUTCString())}.</p>
<table style="width:100%;border-collapse:collapse;">${rows.map(([k, v], i) => `<tr><td style="padding:8px 0;border-top:1px solid #E1E1E6;${i === rows.length - 1 ? "font-weight:600;" : ""}">${escapeHtml(k)}</td><td style="padding:8px 0;border-top:1px solid #E1E1E6;text-align:right;${i === rows.length - 1 ? "font-weight:600;" : ""}">${v}</td></tr>`).join("")}</table>
<p style="color:#67676D;margin:16px 0 0;">Paid with your ${escapeHtml(methodLabel(p))}. Reference ${escapeHtml(pi.id)}. Reply to this email with any questions.</p></div>`;
  const tasks: Promise<unknown>[] = [];
  if (p.client_email) tasks.push(relay(p.client_email, `Receipt: ${p.description}`, receipt, brand.senderName, brand.replyTo));
  if (brand.replyTo) {
    tasks.push(relay(brand.replyTo, `Paid online: ${dollars(total)}${p.client_name ? " — " + p.client_name : ""}`,
      `<p style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14px;">${escapeHtml(p.client_name || "A client")} paid the ${escapeHtml(what)} online. ASP Bookings marks it received automatically.</p>${receipt}`,
      "ASP Bookings", null));
  }
  await Promise.all(tasks);
  // Last, so a failure here (retried by Stripe) never sends the receipt twice.
  await ledgerInsert(sb, p, pi);
}

// The ledger of money received (payments, 0012/0022). Idempotent: one row per Stripe charge.
// deno-lint-ignore no-explicit-any
async function ledgerInsert(sb: any, p: any, pi: any): Promise<void> {
  const total = Number(pi.amount_received || pi.amount) || 0;
  const fee = Number(pi.metadata?.fee_cents) || 0;
  let eventUuid: string | null = null;
  if (p.event_legacy_id) {
    const { data: ev } = await sb.from("events").select("id").eq("legacy_id", p.event_legacy_id).maybeSingle();
    eventUuid = ev?.id || null;
  }
  const what = p.kind === "contract_deposit" ? `deposit for contract ${p.contract_legacy_id}` : `invoice ${p.invoice_legacy_id}`;
  const { error } = await sb.from("payments").upsert({
    event_id: eventUuid, amount: total / 100, expected_amount: p.amount_cents / 100, kind: p.kind === "contract_deposit" ? "deposit" : "balance",
    source: "stripe", source_ref: pi.id, status: "received", received_at: p.paid_at || new Date().toISOString(), payer: p.client_name || null,
    payment_rail: p.pay_method === "us_bank_account" ? "ach" : "credit_card", destination: "asp_operating",
    allocation_status: "allocated",
    notes: `Paid online (${methodLabel(p)}): ${what}${fee ? `, including a ${dollars(fee)} card fee` : ""}.`,
  }, { onConflict: "source,source_ref", ignoreDuplicates: true });
  // Thrown so the webhook answers 500 and Stripe redelivers (the next delivery re-runs this).
  if (error) throw new Error(`payments ledger insert: ${error.message}`);
}

// deno-lint-ignore no-explicit-any
async function reportSecondCharge(sb: any, r: any, pi: any): Promise<void> {
  const total = Number(pi.amount_received || pi.amount) || 0;
  const { error } = await sb.from("payments").upsert({
    amount: total / 100, expected_amount: 0, kind: "overpayment", source: "stripe", source_ref: pi.id, status: "received",
    received_at: new Date().toISOString(), payer: r.client_name || null, payment_rail: pi.metadata?.pay_method === "us_bank_account" ? "ach" : "credit_card",
    destination: "asp_operating", allocation_status: "needs_review",
    notes: `SECOND online payment for ${r.description} (already paid by ${r.payment_intent_id}). Refund one in Stripe.`,
  }, { onConflict: "source,source_ref", ignoreDuplicates: true });
  if (error) throw new Error(`ledger second charge: ${error.message}`);
  console.error("payments: second charge", r.id, pi.id);
  const brand = await brandFor(sb, r.brand_key || undefined);
  if (brand.replyTo) {
    await relay(brand.replyTo, `Action needed: ${r.client_name || "a client"} was charged twice`,
      `<p style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14px;">A second online payment of ${dollars(total)} came in for ${escapeHtml(r.description)}, which was already paid (Stripe ${escapeHtml(r.payment_intent_id)}). Please refund one of them in Stripe: ${escapeHtml(pi.id)}.</p>`,
      "ASP Bookings", null);
  }
}

// A refund or a dispute on a recorded payment: flag it (never un-books anything) and tell the office.
// A partial refund only tells the office; the payment still counts as paid.
// deno-lint-ignore no-explicit-any
export async function recordChargeProblem(sb: any, paymentIntentId: string, problem: "refunded" | "disputed", detail: string, partial = false): Promise<void> {
  const now = new Date().toISOString();
  let p;
  if (partial) {
    const { data, error } = await sb.from("payment_requests").select("*").eq("payment_intent_id", paymentIntentId).maybeSingle();
    if (error) throw new Error(`load refunded payment: ${error.message}`);
    p = data;
  } else {
    const patch = problem === "refunded" ? { pay_status: "refunded", refunded_at: now } : { pay_status: "disputed", disputed_at: now };
    const { data, error } = await sb.from("payment_requests").update(patch).eq("payment_intent_id", paymentIntentId).select("*");
    if (error) throw new Error(`record ${problem}: ${error.message}`);
    p = data?.[0];
  }
  if (!partial) await sb.from("payments").update({ status: problem }).eq("source", "stripe").eq("source_ref", paymentIntentId);
  if (!p || isTestRow(p)) return;
  const brand = await brandFor(sb, p.brand_key || undefined);
  if (brand.replyTo) {
    await relay(brand.replyTo, `Stripe: payment ${problem}${p.client_name ? " — " + p.client_name : ""}`,
      `<p style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14px;">The online payment from ${escapeHtml(p.client_name || "a client")} for ${escapeHtml(p.description)} was <strong>${partial ? "partly refunded" : problem}</strong> (${escapeHtml(detail)}). Nothing in ASP Bookings was changed automatically — check the booking. Stripe reference ${escapeHtml(paymentIntentId)}.</p>`,
      "ASP Bookings", null);
  }
}
