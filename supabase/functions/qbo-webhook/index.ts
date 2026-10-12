// Receives QuickBooks' real-time webhook notifications (Phase 5 of the ops automation spec: "full
// QuickBooks payment sync"). This is the PRIMARY signal for marking a deposit/balance received --
// a scheduled reconciliation poll (NOT BUILT YET -- see ops/QUICKBOOKS_SETUP.md; tracked in the 2026-10-09 audit) would be the backup for anything
// this misses (a dropped webhook, a missed signature, downtime).
//
// Deploy with JWT verification OFF (Intuit's webhook POST carries no Supabase auth token -- this
// function's real security boundary is the HMAC signature check below, same reasoning as
// qbo-oauth-callback needing JWT off for Intuit's redirect).
//
// Function Secrets needed: QBO_WEBHOOK_VERIFIER_TOKEN (from the Intuit Developer app's Webhooks
// tab), plus the same QBO_CLIENT_ID/QBO_CLIENT_SECRET/QBO_ENVIRONMENT this project's other QBO
// functions already use (to look up the full Payment record and refresh the access token).
//
// UNVERIFIED: written against Intuit's documented webhook payload/signature shape, but never
// exercised against a real QuickBooks sandbox (none was available in this environment) -- treat
// this as a solid starting point to test against a real "Payment" webhook delivery once QuickBooks
// is connected, not as already-proven-correct code. The payment-vs-invoice-amount classification
// below (deposit/partial/overpayment) is a best-effort structural read, not something QuickBooks
// states directly -- re-check it against a handful of real payloads before trusting it blindly.
import { serviceClient } from "../_shared/auth.ts";
import { qboFetch } from "../_shared/qbo.ts";

async function verifySignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const verifierToken = Deno.env.get("QBO_WEBHOOK_VERIFIER_TOKEN");
  if (!verifierToken || !signatureHeader) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(verifierToken),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
  return timingSafeEqual(computed, signatureHeader);
}

// Constant-time string compare, so response timing can't be used to guess a valid signature.
function timingSafeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a), eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

// Records one payment notification, deduped by (source='quickbooks', source_ref=qboPaymentId).
// One atomic upsert on the unique (source, source_ref) constraint (migration 0033): QuickBooks can
// redeliver the same webhook, and two concurrent deliveries used to both pass a select-then-insert
// check and create duplicate "received" payments. Errors are thrown so they reach the log.
async function upsertPayment(sb: ReturnType<typeof serviceClient>, row: Record<string, unknown>) {
  // ignoreDuplicates: a redelivery (or a later Intuit "Update" event) must not reset a payment an
  // admin has already reviewed back to unmatched/needs_review. The first record stands.
  const { error } = await sb.from("payments").upsert(row, { onConflict: "source,source_ref", ignoreDuplicates: true });
  if (error) throw new Error(`payments upsert failed: ${error.message}`);
}

async function handlePaymentEntity(sb: ReturnType<typeof serviceClient>, qboPaymentId: string) {
  const resp = await qboFetch(`/payment/${qboPaymentId}`);
  if (!resp.ok) {
    console.error("qbo-webhook: could not fetch Payment", qboPaymentId, await resp.text());
    return;
  }
  const payment = (await resp.json())?.Payment;
  if (!payment) return;

  const totalAmt = Number(payment.TotalAmt) || 0;
  const linkedInvoice = (payment.Line || [])
    .flatMap((l: any) => l.LinkedTxn || [])
    .find((lt: any) => lt.TxnType === "Invoice");
  const qboInvoiceId = linkedInvoice?.TxnId || null;

  let invoiceRow = null as { id: string; amount: number } | null;
  if (qboInvoiceId) {
    const { data } = await sb.from("qbo_invoices").select("id, amount").eq("qbo_invoice_id", qboInvoiceId).maybeSingle();
    invoiceRow = data;
  }

  if (!invoiceRow) {
    // Never discard an unresolvable signal -- same principle as zelle_notifications' 'unmatched'
    // status. An admin reconciliation queue reads these (see the Notes in the setup doc).
    await upsertPayment(sb, {
      qbo_invoice_id: null, amount: totalAmt, kind: "deposit", source: "quickbooks",
      source_ref: payment.Id, status: "unmatched", received_at: payment.TxnDate || new Date().toISOString(),
      notes: `No matching qbo_invoices row for QuickBooks invoice ${qboInvoiceId || "(none linked)"}.`,
      allocation_status: "needs_review", expected_amount: null,
    });
    return;
  }

  const kind = totalAmt > invoiceRow.amount ? "overpayment" : totalAmt < invoiceRow.amount ? "partial" : "deposit";
  // "Never auto-allocate a mismatched payment by amount alone" -- only an exact match against the
  // invoice's own amount is allocated automatically; partial/overpayment always goes to
  // needs_review for a human to resolve, even though `kind` already classifies which case it is.
  await upsertPayment(sb, {
    qbo_invoice_id: invoiceRow.id, amount: totalAmt, kind, source: "quickbooks",
    source_ref: payment.Id, status: "received", received_at: payment.TxnDate || new Date().toISOString(),
    notes: "", expected_amount: invoiceRow.amount,
    allocation_status: totalAmt === invoiceRow.amount ? "allocated" : "needs_review",
  });

  const qbStatus = kind === "partial" ? "partially_paid" : "paid";
  const { error: invErr } = await sb.from("qbo_invoices").update({ status: qbStatus, updated_at: new Date().toISOString() }).eq("id", invoiceRow.id);
  if (invErr) throw new Error(`qbo_invoices update failed: ${invErr.message}`);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const rawBody = await req.text();
  const signature = req.headers.get("intuit-signature");
  const verified = await verifySignature(rawBody, signature);
  if (!verified) {
    console.error("qbo-webhook: signature verification failed");
    return new Response("invalid signature", { status: 401 });
  }

  let payload: { eventNotifications?: Array<{ realmId: string; dataChangeEvent?: { entities?: Array<{ name: string; id: string; operation: string }> } }> };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const sb = serviceClient();
  if (!payload.eventNotifications?.length) {
    // Unknown/new payload shape (e.g. Intuit's CloudEvents format) -- log it instead of silently dropping.
    console.error("qbo-webhook: no eventNotifications in payload; first 300 chars:", rawBody.slice(0, 300));
  }
  // Only process notifications for the QuickBooks company ASP actually connected.
  const { data: conn } = await sb.from("qbo_connection").select("realm_id").eq("id", 1).maybeSingle();
  for (const notif of payload.eventNotifications || []) {
    if (!conn?.realm_id || notif.realmId !== conn.realm_id) {
      console.error("qbo-webhook: ignoring notification for unexpected realm", notif.realmId);
      continue;
    }
    for (const entity of notif.dataChangeEvent?.entities || []) {
      if (entity.name === "Payment") {
        try {
          await handlePaymentEntity(sb, entity.id);
        } catch (err) {
          console.error("qbo-webhook: failed to process Payment", entity.id, err);
        }
      }
      // Invoice-entity notifications (created/updated) deliberately do NOT touch payments --
      // "never mark a deposit/balance paid solely because an invoice was created or sent" (item 3).
    }
  }

  // Acknowledge quickly regardless of per-entity outcome -- QuickBooks expects a fast 200 and will
  // retry the whole notification on non-2xx, which would re-process already-handled entities
  // (harmless here since upsertPayment is idempotent, but still wasteful).
  return new Response("ok", { status: 200 });
});
