// Receives QuickBooks' real-time webhook notifications (Phase 5 of the ops automation spec: "full
// QuickBooks payment sync"). This is the PRIMARY signal for marking a deposit/balance received --
// a scheduled reconciliation poll (see ops/QUICKBOOKS_WEBHOOK_SETUP.md) is the backup for anything
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
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function serviceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

function apiBase() {
  return (Deno.env.get("QBO_ENVIRONMENT") === "sandbox")
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";
}

const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

async function getValidAccessToken(): Promise<{ accessToken: string; realmId: string }> {
  const sb = serviceClient();
  const { data: row, error } = await sb.from("qbo_connection").select("*").eq("id", 1).maybeSingle();
  if (error || !row) throw new Error("QuickBooks is not connected.");

  const msLeft = new Date(row.access_token_expires_at).getTime() - Date.now();
  if (msLeft > 60_000) return { accessToken: row.access_token, realmId: row.realm_id };

  const clientId = Deno.env.get("QBO_CLIENT_ID")!;
  const clientSecret = Deno.env.get("QBO_CLIENT_SECRET")!;
  const basicAuth = btoa(`${clientId}:${clientSecret}`);
  const resp = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: { "Authorization": `Basic ${basicAuth}`, "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: row.refresh_token }),
  });
  if (!resp.ok) throw new Error("Could not refresh the QuickBooks connection.");
  const tokens = await resp.json();
  await sb.from("qbo_connection").update({
    access_token: tokens.access_token, refresh_token: tokens.refresh_token,
    access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    refresh_token_expires_at: new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  return { accessToken: tokens.access_token, realmId: row.realm_id };
}

async function qboFetch(path: string) {
  const { accessToken, realmId } = await getValidAccessToken();
  return fetch(`${apiBase()}/v3/company/${realmId}${path}`, {
    headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" },
  });
}

async function verifySignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const verifierToken = Deno.env.get("QBO_WEBHOOK_VERIFIER_TOKEN");
  if (!verifierToken || !signatureHeader) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(verifierToken),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
  return computed === signatureHeader;
}

// Records one payment notification, deduped by (source='quickbooks', source_ref=qboPaymentId) --
// an idempotent upsert since QuickBooks can redeliver the same webhook more than once.
async function upsertPayment(sb: ReturnType<typeof serviceClient>, row: Record<string, unknown>) {
  const { data: existing } = await sb.from("payments").select("id").eq("source", "quickbooks").eq("source_ref", row.source_ref).maybeSingle();
  if (existing) {
    await sb.from("payments").update(row).eq("id", existing.id);
  } else {
    await sb.from("payments").insert(row);
  }
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
    });
    return;
  }

  const kind = totalAmt > invoiceRow.amount ? "overpayment" : totalAmt < invoiceRow.amount ? "partial" : "deposit";
  await upsertPayment(sb, {
    qbo_invoice_id: invoiceRow.id, amount: totalAmt, kind, source: "quickbooks",
    source_ref: payment.Id, status: "received", received_at: payment.TxnDate || new Date().toISOString(),
    notes: "",
  });

  const qbStatus = kind === "partial" ? "partially_paid" : "paid";
  await sb.from("qbo_invoices").update({ status: qbStatus, updated_at: new Date().toISOString() }).eq("id", invoiceRow.id);
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
  for (const notif of payload.eventNotifications || []) {
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
