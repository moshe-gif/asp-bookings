// The client's side of paying online (migration 0056, ops/STRIPE_SETUP.md). The /sign/ page (deposit,
// after signing) and the /pay/ page (custom invoice) call this. No login -- the client is not an ASP
// user. Deploy with JWT verification OFF; the security boundary is the link's token, stored only as
// its SHA-256 (same as contract-sign).
//
//   POST { action: "view",   token }                                   -> what's owed and its status
//   POST { action: "quote",  token, confirmationTokenId }              -> the card fee and total for
//                                                                         the card/bank the client entered
//   POST { action: "pay",    token, confirmationTokenId, totalCents }  -> charges it (totalCents must be
//                                                                         the total the client was shown)
//   POST { action: "refresh", token }                                  -> re-reads the charge after 3-D Secure
//
// The browser never sends an amount Stripe charges: the server decides it from the row (amount and
// card fee frozen when the link was made) and the card's funding type, which Stripe reports from the
// ConfirmationToken before anything is charged. A credit card pays the fee; debit, prepaid and bank
// transfers don't.
//
// Three kinds of link: a contract's deposit and a custom invoice go to ASP; a gig's balance
// (event_balance, 0063) goes straight to the artist's Stripe account (a destination charge: ASP is the
// business the client pays, and any card fee stays with ASP to cover Stripe's fee).
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { serviceClient } from "../_shared/auth.ts";
import { brandFor } from "../_shared/config.ts";
import { cardFeeCents, recordPaymentIntent, stripeApi, stripeConfigured, stripeMode } from "../_shared/stripe.ts";
import { balanceZelle, depositZelle, officePhone } from "../_shared/payblock.ts";
import { balancePayeeProfile, balanceSplit, gigCardFeeBps, splitAccounts } from "../_shared/connect.ts";

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const CT_RE = /^ctoken_[A-Za-z0-9]{8,}$/;

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;
const isTest = (r: Row) => (r.contract_legacy_id || "").startsWith("CT-TEST-") || (r.invoice_legacy_id || "").startsWith("INV-TEST-")
  || (r.kind === "event_balance" && (r.event_legacy_id || "").startsWith("EV-TEST-"));
// The links for the same deposit, invoice or gig balance as this one (only one of them may take money).
// deno-lint-ignore no-explicit-any
const sameThing = (q: any, r: Row) => r.kind === "contract_deposit" ? q.eq("kind", r.kind).eq("contract_legacy_id", r.contract_legacy_id).eq("contract_created_at", r.contract_created_at)
  : r.kind === "invoice" ? q.eq("kind", r.kind).eq("invoice_legacy_id", r.invoice_legacy_id).eq("invoice_created_at", r.invoice_created_at)
  : q.eq("kind", r.kind).eq("event_legacy_id", r.event_legacy_id);
const referenceOf = (r: Row) => r.kind === "contract_deposit" ? r.contract_legacy_id : r.kind === "invoice" ? r.invoice_legacy_id : r.event_legacy_id;

// Why this link can't take a payment right now, or null. A paid link is still viewable (the receipt).
// deno-lint-ignore no-explicit-any
async function blocker(sb: any, r: Row, tokenHash: string): Promise<string | null> {
  if (["paid", "refunded", "disputed"].includes(r.pay_status)) return "paid";
  if (r.pay_status === "processing") return "processing";
  if (r.revoked_at) return "revoked";
  if (new Date(r.expires_at) <= new Date()) return "expired";
  // Harness rows skip the checks below, so they never take real money.
  if (isTest(r) && stripeMode() === "live") return "revoked";
  // Another link for the same contract or invoice already took the money.
  const { data: others } = await sameThing(sb.from("payment_requests").select("id"), r)
    .neq("id", r.id).in("pay_status", ["processing", "paid", "refunded", "disputed"]).limit(1);
  if (others?.length) return "paid_elsewhere";
  if (r.kind === "contract_deposit") {
    // The deposit is paid after signing: this link's contract must be signed, to these terms.
    const { data: own } = await sb.from("contract_sign_requests").select("terms_sha256, revoked_at, signed_at").eq("token_hash", tokenHash).maybeSingle();
    if (!own || (own.revoked_at && !own.signed_at)) return "revoked";
    const { data: signed } = await sb.from("contract_sign_requests").select("id")
      .eq("contract_legacy_id", r.contract_legacy_id).eq("contract_created_at", r.contract_created_at)
      .eq("terms_sha256", own.terms_sha256).not("signed_at", "is", null).limit(1);
    if (!signed?.length) return "unsigned";
    if (!isTest(r)) {
      const { data: rec } = await sb.from("app_records").select("app_doc").eq("collection", "contracts").eq("legacy_id", r.contract_legacy_id).maybeSingle();
      const doc = rec?.app_doc;
      if (!doc || doc.createdAt !== r.contract_created_at || doc.status === "void") return "void";
      // The terms the link was signed to must still be the contract's approved terms: an older link
      // (say, a since-lowered deposit) can't be paid once the office re-approves new terms.
      if ((await sha256Hex(doc.approvedTermsFingerprint || "")) !== own.terms_sha256) return "revoked";
      // Already paid another way (Zelle, check) and verified by the office.
      if (r.event_legacy_id) {
        const { data: ev } = await sb.from("events").select("app_doc").eq("legacy_id", r.event_legacy_id).maybeSingle();
        if (ev?.app_doc?.depositReceived) return "paid_elsewhere";
      }
    }
  } else if (r.kind === "event_balance") {
    if (!isTest(r)) {
      const { data: evRow } = await sb.from("events").select("app_doc").eq("legacy_id", r.event_legacy_id).maybeSingle();
      const ev = evRow?.app_doc;
      if (!ev) return "void";
      if (ev.balanceReceived) return "paid_elsewhere";
      // The link pays what was owed, to whom, when it was made: if the balance or the gig's payee has
      // changed since, the office sends a new link (and nothing goes to an artist no longer on the gig).
      if (!ev.depositReceived) return "revoked";
      if (ev.paymentMethod && ev.paymentMethod !== "standard") return "revoked";
      // What the client owes now (after the contract's deposit) must still be what the link asks for,
      // and every artist's payee must have a working Stripe account, or Pay would fail.
      const split = await balanceSplit(sb, r.event_legacy_id, ev);
      if (!split || split.totalCents !== r.amount_cents) return "revoked";
      if (stripeConfigured() && split.parts.length && !(await splitAccounts(sb, split.parts, stripeMode() === "live"))) return "revoked";
      // Never more card fee than the office's setting allows for this gig (none in CT/MA).
      if (r.card_fee_bps > await gigCardFeeBps(sb, ev)) return "revoked";
      const payee = await balancePayeeProfile(sb, r.event_legacy_id, ev);
      if (!payee || payee.id !== r.payee_profile_id) return "revoked";
    }
  } else if (!isTest(r)) {
    const { data: rec } = await sb.from("app_records").select("app_doc").eq("collection", "invoices").eq("legacy_id", r.invoice_legacy_id).maybeSingle();
    const doc = rec?.app_doc;
    // An invoice is identified by its id plus its creation timestamp (createdTs; ids are per-browser
    // counters that can be reused, and its createdAt is only a date).
    if (!doc || (doc.createdTs || doc.createdAt) !== r.invoice_created_at || doc.status === "void") return "void";
    if (doc.status === "paid") return "paid_elsewhere";
  }
  return null;
}

// What the page shows. Never includes Stripe secrets or anyone else's data.
// deno-lint-ignore no-explicit-any
async function viewOf(sb: any, r: Row, tokenHash: string) {
  const brand = await brandFor(sb, r.brand_key || undefined);
  // The Zelle box under the card form and the office phone for the check/cash line. Deposits and
  // invoices go to ASP's Zelle (creative contracts' deposits too, owner 2026-10-16); a balance to the
  // artist's, as on the balance email.
  const zelle = r.kind === "event_balance" ? (isTest(r) ? null : await balanceZelle(sb, r.event_legacy_id)) : await depositZelle(sb);
  const phone = await officePhone(sb, brand.key);
  const block = await blocker(sb, r, tokenHash);
  return {
    kind: r.kind,
    status: r.pay_status,
    blocked: block,
    available: stripeConfigured(),
    testMode: stripeMode() === "test",
    publishableKey: Deno.env.get("STRIPE_PUBLISHABLE_KEY") || null,
    description: r.description,
    reference: referenceOf(r),
    amountCents: r.amount_cents,
    cardFeeBps: r.card_fee_bps,
    clientName: r.client_name || "",
    brandName: brand.senderName,
    replyTo: brand.replyTo,
    zelle,
    officePhone: phone,
    memo: r.kind === "event_balance" ? [r.client_name, (r.description.match(/\(([^)]+)\)$/) || [])[1]].filter(Boolean).join(" ") : referenceOf(r),
    html: r.kind === "invoice" ? r.rendered_html : undefined,
    failureMessage: r.pay_status === "failed" ? r.failure_message : null,
    paid: ["paid", "refunded", "disputed"].includes(r.pay_status)
      ? { at: r.paid_at, totalCents: r.total_cents, feeCents: r.fee_cents || 0, method: r.pay_method, brand: r.card_brand, funding: r.card_funding, last4: r.pay_last4 }
      : null,
    processing: r.pay_status === "processing" ? { at: r.processing_at, last4: r.pay_last4 } : null,
  };
}

// The card or bank the client entered (from Stripe, not the browser) and what it costs them.
async function quoteFor(r: Row, confirmationTokenId: string) {
  const ct = await stripeApi("GET", `/confirmation_tokens/${confirmationTokenId}`);
  if (!ct.ok) return { error: "bad_payment_details" as const };
  const t = ct.data;
  if (t.payment_intent || t.setup_intent) return { error: "bad_payment_details" as const };
  if (t.livemode !== (stripeMode() === "live")) return { error: "bad_payment_details" as const };
  const prev = t.payment_method_preview || {};
  const method = prev.type;
  if (method !== "card" && method !== "us_bank_account") return { error: "unsupported_method" as const };
  // Wallets are turned off on the page (their payment sheet shows a fixed amount before the fee is known).
  if (method === "card" && prev.card?.wallet) return { error: "unsupported_method" as const };
  const funding = method === "card" ? (prev.card?.funding || "unknown") : null;
  const fee = cardFeeCents(r.amount_cents, r.card_fee_bps, method, funding);
  return {
    quote: {
      method, funding,
      brand: method === "card" ? (prev.card?.display_brand || prev.card?.brand || null) : (prev.us_bank_account?.bank_name || null),
      last4: method === "card" ? (prev.card?.last4 || null) : (prev.us_bank_account?.last4 || null),
      amountCents: r.amount_cents, feeCents: fee, totalCents: r.amount_cents + fee,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  const body = await readJson<{ action?: string; token?: string; confirmationTokenId?: string; totalCents?: number }>(req);
  if (!body || typeof body.token !== "string" || !TOKEN_RE.test(body.token)) return json({ ok: false, error: "not_found" }, 404);
  const sb = serviceClient();
  const tokenHash = await sha256Hex(body.token);
  const { data: r, error } = await sb.from("payment_requests").select("*").eq("token_hash", tokenHash).maybeSingle();
  if (error) { console.error("client-pay load", error.message); return json({ ok: false, error: "server" }, 500); }

  if (body.action === "view") {
    // A signing link made without a deposit has no payment row: the page just doesn't show one.
    if (!r) return json({ ok: true, payment: null });
    if (!r.first_viewed_at) await sb.from("payment_requests").update({ first_viewed_at: new Date().toISOString() }).eq("id", r.id);
    let row = r;
    // A paid balance split between artists: make sure every share went out (a no-op once they have).
    if (r.kind === "event_balance" && r.pay_status === "paid" && r.payment_intent_id && stripeConfigured()) {
      const pi = await stripeApi("GET", `/payment_intents/${r.payment_intent_id}`);
      if (pi.ok && pi.data?.metadata?.split) { try { await recordPaymentIntent(sb, pi.data); } catch (err) { console.error("client-pay view split", String(err)); } }
    }
    if (r.payment_intent_id && ["open", "failed", "processing"].includes(r.pay_status) && stripeConfigured()) {
      const pi = await stripeApi("GET", `/payment_intents/${r.payment_intent_id}`);
      if (pi.ok) {
        try { await recordPaymentIntent(sb, pi.data); } catch (err) { console.error("client-pay view record", String(err)); }
        const { data: fresh } = await sb.from("payment_requests").select("*").eq("id", r.id).single();
        if (fresh) row = fresh;
      }
    }
    return json({ ok: true, payment: await viewOf(sb, row, tokenHash) });
  }
  if (!r) return json({ ok: false, error: "not_found" }, 404);

  if (body.action === "refresh") {
    if (r.payment_intent_id && stripeConfigured()) {
      const pi = await stripeApi("GET", `/payment_intents/${r.payment_intent_id}`);
      if (pi.ok) { try { await recordPaymentIntent(sb, pi.data); } catch (err) { console.error("client-pay refresh record", String(err)); } }
    }
    const { data: fresh } = await sb.from("payment_requests").select("*").eq("id", r.id).single();
    return json({ ok: true, payment: await viewOf(sb, fresh, tokenHash) });
  }

  if (body.action !== "quote" && body.action !== "pay") return json({ ok: false, error: "unknown action" }, 400);
  if (!stripeConfigured()) return json({ ok: false, error: "unavailable" }, 503);
  if (typeof body.confirmationTokenId !== "string" || !CT_RE.test(body.confirmationTokenId)) return json({ ok: false, error: "bad_payment_details" }, 400);
  const block = await blocker(sb, r, tokenHash);
  if (block) return json({ ok: false, error: block }, 409);
  const q = await quoteFor(r, body.confirmationTokenId);
  if (q.error) return json({ ok: false, error: q.error }, 400);
  const quote = q.quote!;
  if (body.action === "quote") return json({ ok: true, quote });

  // pay: only the exact total the client was shown.
  if (body.totalCents !== quote.totalCents) return json({ ok: false, error: "quote_changed", quote }, 409);
  // One attempt at a time per contract/invoice (two tabs, a double tap, two emailed links), and none
  // once any link for it is paid or processing. The claim returns the row as it is now.
  const { data: claim, error: claimErr } = await sb.rpc("claim_payment_attempt", { p_id: r.id });
  if (claimErr) { console.error("client-pay claim", claimErr.message); return json({ ok: false, error: "server" }, 500); }
  if (claim?.error) return json({ ok: false, error: claim.error === "paid" ? "paid_elsewhere" : claim.error }, 409);
  const release = () => sb.from("payment_requests").update({ attempt_started_at: null }).eq("id", r.id);
  const charged = (status: string) => json({ ok: false, error: status === "succeeded" ? "paid" : "processing" }, 409);

  // Make sure no earlier intent for this link can still complete as a second charge: one Stripe
  // knows about (the last stored attempt) and any the database never heard about (a timeout).
  // Every link for the same contract/invoice counts (a re-sent email's link must not charge while an
  // older link's 3-D Secure check is still open).
  const { data: siblings, error: sibErr } = await sameThing(sb.from("payment_requests").select("id, payment_intent_id"), r).order("created_at", { ascending: false }).limit(20);
  if (sibErr) { await release(); return json({ ok: false, error: "busy" }, 409); }
  const earlier = new Set<string>();
  if (claim.payment_intent_id) earlier.add(claim.payment_intent_id);
  for (const sib of siblings || []) {
    if (sib.payment_intent_id) earlier.add(sib.payment_intent_id);
    const found = await stripeApi("GET", `/payment_intents/search?query=${encodeURIComponent(`metadata['payment_request_id']:'${sib.id}'`)}&limit=20`);
    if (!found.ok) { await release(); return json({ ok: false, error: "busy" }, 409); }
    for (const x of found.data?.data || []) earlier.add(x.id);
  }
  for (const id of earlier) {
    let old = await stripeApi("GET", `/payment_intents/${id}`);
    if (!old.ok) { await release(); return json({ ok: false, error: "busy" }, 409); }
    if (["requires_action", "requires_confirmation", "requires_payment_method", "requires_capture"].includes(old.data.status)) {
      const cancel = await stripeApi("POST", `/payment_intents/${id}/cancel`, {});
      if (!cancel.ok) old = await stripeApi("GET", `/payment_intents/${id}`);
      else continue;
      if (!old.ok || !["canceled", "succeeded", "processing"].includes(old.data.status)) { await release(); return json({ ok: false, error: "busy" }, 409); }
    }
    if (["succeeded", "processing"].includes(old.data.status)) {
      try { await recordPaymentIntent(sb, old.data); } catch (err) { console.error("client-pay record earlier", String(err)); }
      return charged(old.data.status);
    }
  }

  const ref = referenceOf(r);
  // A balance goes to the artists' Stripe accounts, checked live: Stripe must say each can receive money
  // now. One artist: a destination charge. Several (owner 2026-10-16: one payment, split
  // automatically): the charge stays on ASP's account and each share is transferred from it once it's
  // paid (recordPaymentIntent), as frozen in the charge's metadata here. The split always adds up to
  // the link's amount (checked against the gig just now by blocker()).
  // ASP keeps the card fee, plus its part of the balance when the deposit was less than its cut.
  let destination: string | null = null;
  let split: { account: string; cents: number }[] | null = null;
  let aspCents = 0, heldByAspCents = 0;
  if (r.kind === "event_balance") {
    let plan = null;
    if (isTest(r)) plan = { parts: [{ payeeProfileId: r.payee_profile_id, cents: r.amount_cents, name: "" }], aspCents: 0, heldByAspCents: 0, totalCents: r.amount_cents };
    else {
      const { data: evRow } = await sb.from("events").select("app_doc").eq("legacy_id", r.event_legacy_id).maybeSingle();
      plan = evRow?.app_doc ? await balanceSplit(sb, r.event_legacy_id, evRow.app_doc) : null;
    }
    const accounts = plan && plan.totalCents === r.amount_cents ? (plan.parts.length ? await splitAccounts(sb, plan.parts, stripeMode() === "live") : []) : null;
    if (!plan || !accounts) { await release(); return json({ ok: false, error: "unavailable" }, 503); }
    aspCents = plan.aspCents; heldByAspCents = plan.heldByAspCents;
    if (accounts.length === 1) destination = accounts[0].account;
    else if (accounts.length > 1) split = accounts;
  }
  const aspFee = quote.feeCents + aspCents;
  const params = {
    amount: quote.totalCents, currency: "usd", confirm: true, confirmation_token: body.confirmationTokenId,
    payment_method_types: [quote.method],
    // Instant bank verification only: micro-deposits would leave the client stuck on this page.
    ...(quote.method === "us_bank_account" ? { payment_method_options: { us_bank_account: { verification_method: "instant" } } } : {}),
    description: `${r.description}${quote.feeCents ? " (incl. credit card fee)" : ""}`.slice(0, 300),
    // The artist gets their share; ASP keeps the card fee (if any) and its own part (aspCents).
    ...(destination ? { transfer_data: { destination }, ...(aspFee ? { application_fee_amount: aspFee } : {}) } : {}),
    metadata: {
      payment_request_id: r.id, kind: r.kind, reference: ref, event: r.event_legacy_id || "",
      base_cents: String(r.amount_cents), fee_cents: String(quote.feeCents), pay_method: quote.method,
      card_brand: quote.method === "card" ? (quote.brand || "") : "", card_funding: quote.funding || "", last4: quote.last4 || "",
      payee_profile_id: r.payee_profile_id || "", destination: destination || "",
      ...(split ? { split: JSON.stringify(split.map((x) => [x.account, x.cents])) } : {}),
      ...(aspCents ? { asp_cents: String(aspCents) } : {}), ...(heldByAspCents ? { held_by_asp_cents: String(heldByAspCents) } : {}),
    },
    ...(split ? { transfer_group: `pr_${r.id}` } : {}),
  };
  const idem = `pr-${r.id}-${body.confirmationTokenId}`;
  let pi = await stripeApi("POST", "/payment_intents", params, idem);
  // Stripe or the network failed (not a decline): the charge may or may not exist. Retry with the
  // same idempotency key, which returns the original outcome instead of charging again.
  // (409: Stripe is still working on the first request with this key.)
  const unknown = (x: typeof pi) => !x.ok && (x.status >= 500 || x.status === 429 || x.status === 409 || !x.data?.error?.type
    || x.data.error.type === "api_error" || x.data.error.type === "idempotency_error");
  if (unknown(pi)) pi = await stripeApi("POST", "/payment_intents", params, idem);

  const intent = pi.ok ? pi.data : pi.data?.error?.payment_intent;
  await sb.from("payment_requests").update({
    payment_intent_id: intent?.id || claim.payment_intent_id, pay_method: quote.method, card_brand: quote.method === "card" ? quote.brand : null,
    card_funding: quote.funding, pay_last4: quote.last4, fee_cents: quote.feeCents, total_cents: quote.totalCents,
  }).eq("id", r.id).is("paid_at", null);

  if (unknown(pi)) {
    // Keep the claim (2 minutes): the next attempt first looks the charge up in Stripe.
    console.error("client-pay stripe unavailable", pi.status, pi.data?.error?.message);
    return json({ ok: false, error: "unknown" }, 503);
  }
  if (!pi.ok) {
    const msg = pi.data?.error?.message || "The payment didn't go through.";
    await sb.from("payment_requests").update({ pay_status: "failed", failed_at: new Date().toISOString(), failure_message: String(msg).slice(0, 300), attempt_started_at: null })
      .eq("id", r.id).in("pay_status", ["open", "failed"]);
    return json({ ok: false, error: "declined", message: pi.data?.error?.type === "card_error" ? msg : "The payment didn't go through. Please check the details and try again." }, 402);
  }
  // The charge stands even if recording it hiccups: the webhook and the next view record it again.
  try { await recordPaymentIntent(sb, pi.data); } catch (err) { console.error("client-pay record", String(err)); }
  return json({ ok: true, status: pi.data.status, clientSecret: pi.data.status === "requires_action" ? pi.data.client_secret : undefined });
});
