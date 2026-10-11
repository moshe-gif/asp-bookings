// Creates a QuickBooks Online invoice for a client (find-or-create the Customer by email, one
// line item for the amount/description given) and has QuickBooks itself email it -- QB's hosted
// invoice includes its own "Pay Now" credit-card link (QuickBooks Payments), so this never touches
// card numbers directly; that stays entirely on Intuit's side. Called from the Send Contract flow
// to bill the deposit, but takes plain fields so it isn't coupled to the contract shape.
//
// Function Secrets needed: QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_ENVIRONMENT ("sandbox" or
// "production", defaults to production if unset).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Called directly via fetch() from the browser -- without these headers the browser's CORS
// preflight (an automatic OPTIONS request before any cross-origin POST carrying custom headers
// like apikey/Content-Type) fails with no server-visible error; the app just sees "Failed to
// fetch". Same fix as send-contract-email/index.ts.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
}

const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
function apiBase() {
  return (Deno.env.get("QBO_ENVIRONMENT") === "sandbox")
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";
}

function serviceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function getValidAccessToken(): Promise<{ accessToken: string; realmId: string }> {
  const sb = serviceClient();
  const { data: row, error } = await sb.from("qbo_connection").select("*").eq("id", 1).maybeSingle();
  if (error || !row) throw new Error("QuickBooks is not connected yet -- connect it in Settings first.");

  const msLeft = new Date(row.access_token_expires_at).getTime() - Date.now();
  if (msLeft > 60_000) {
    return { accessToken: row.access_token, realmId: row.realm_id };
  }

  const clientId = Deno.env.get("QBO_CLIENT_ID")!;
  const clientSecret = Deno.env.get("QBO_CLIENT_SECRET")!;
  const basicAuth = btoa(`${clientId}:${clientSecret}`);
  const resp = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: row.refresh_token }),
  });
  if (!resp.ok) throw new Error("Could not refresh the QuickBooks connection -- it may need to be reconnected in Settings.");
  const tokens = await resp.json();
  await sb.from("qbo_connection").update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    refresh_token_expires_at: new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  return { accessToken: tokens.access_token, realmId: row.realm_id };
}

async function qboFetch(path: string, init: RequestInit = {}) {
  const { accessToken, realmId } = await getValidAccessToken();
  return fetch(`${apiBase()}/v3/company/${realmId}${path}`, {
    ...init,
    headers: { ...(init.headers || {}), "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return json({ ok: false, error: "not authenticated" }, 401);
  const { data: isAdmin, error: adminErr } = await supabase.rpc("is_admin");
  if (adminErr || !isAdmin) return json({ ok: false, error: "not authorized" }, 403);

  let body: { clientName?: string; clientEmail?: string; amount?: number; description?: string; eventId?: string; contractId?: string; idempotencyKey?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "bad json" }, 400);
  }
  const { clientName, clientEmail, amount, description, eventId, contractId, idempotencyKey } = body || {};
  // Idempotency (2026-10-09 audit 2.14): QuickBooks treats repeated POSTs with the same `requestid`
  // as one request, so a double-click, a retry or a second open tab can't bill the client twice.
  // The app sends one stable key per contract deposit invoice.
  if (!idempotencyKey || !/^[A-Za-z0-9-]{3,60}$/.test(idempotencyKey)) {
    return json({ ok: false, error: "missing or invalid idempotencyKey" }, 400);
  }
  // QuickBooks returns the cached original response for a repeated requestid WITHOUT comparing the
  // body, so the key must cover what is being billed: the same contract + amount + recipient +
  // description dedupes (double-click, second tab), while a corrected resend gets a new invoice.
  // The customer key depends on the email only (one QuickBooks customer per client email).
  const sha = async (text: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))), (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
  const invoiceKey = await sha(`${idempotencyKey}|${amount}|${clientEmail.toLowerCase()}|${description || "Deposit"}`);
  const customerKey = await sha(`customer|${clientEmail.toLowerCase()}`);
  if (!clientName || !clientEmail || !amount || amount <= 0) {
    return json({ ok: false, error: "missing or invalid fields (clientName, clientEmail, amount required)" }, 400);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmail)) {
    return json({ ok: false, error: "invalid client email" }, 400);
  }

  try {
    const escapedEmail = clientEmail.replace(/'/g, "\\'");
    const queryResp = await qboFetch(`/query?query=${encodeURIComponent(`select * from Customer where PrimaryEmailAddr = '${escapedEmail}'`)}`);
    const queryData = await queryResp.json();
    if (!queryResp.ok) return json({ ok: false, error: queryData?.Fault?.Error?.[0]?.Message || "could not look up QuickBooks customer" }, 502);
    let customerId = queryData?.QueryResponse?.Customer?.[0]?.Id;

    if (!customerId) {
      const custResp = await qboFetch(`/customer?requestid=${customerKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ DisplayName: clientName, PrimaryEmailAddr: { Address: clientEmail } }),
      });
      const custData = await custResp.json();
      if (!custResp.ok) return json({ ok: false, error: custData?.Fault?.Error?.[0]?.Message || "could not create QuickBooks customer" }, 502);
      customerId = custData.Customer.Id;
    }

    const invoiceResp = await qboFetch(`/invoice?requestid=${invoiceKey}i`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        CustomerRef: { value: customerId },
        Line: [{
          Amount: amount,
          DetailType: "SalesItemLineDetail",
          Description: description || "Deposit",
          SalesItemLineDetail: { Qty: 1, UnitPrice: amount },
        }],
      }),
    });
    const invoiceData = await invoiceResp.json();
    if (!invoiceResp.ok) return json({ ok: false, error: invoiceData?.Fault?.Error?.[0]?.Message || "could not create invoice" }, 502);
    const invoiceId = invoiceData.Invoice.Id;
    const docNumber = invoiceData.Invoice.DocNumber;

    const sendResp = await qboFetch(`/invoice/${invoiceId}/send?sendTo=${encodeURIComponent(clientEmail)}&requestid=${invoiceKey}s`, { method: "POST" });
    if (!sendResp.ok) {
      const sendData = await sendResp.json().catch(() => ({}));
      return json({ ok: false, error: sendData?.Fault?.Error?.[0]?.Message || "invoice created but could not be emailed", invoiceId }, 502);
    }

    // Record it locally so qbo-webhook can later resolve an incoming payment notification back to
    // this event -- without this row, every payment for an invoice created here would show up as
    // "unmatched" even though ASP itself created it moments earlier. Best-effort: the invoice is
    // already sent at this point, so a failure here is logged, not returned as an overall failure
    // (the caller already has invoiceId/docNumber and the client already has their invoice).
    try {
      const { realmId } = await getValidAccessToken();
      const sb = serviceClient();
      const { error: insertErr } = await sb.from("qbo_invoices").insert({
        event_id: eventId || null, contract_id: contractId || null,
        qbo_realm_id: realmId, qbo_invoice_id: String(invoiceId), doc_number: docNumber || null,
        amount, description: description || "", status: "sent",
      });
      if (insertErr) console.error("qbo-create-invoice: could not record qbo_invoices row", insertErr);
    } catch (err) {
      console.error("qbo-create-invoice: could not record qbo_invoices row", err);
    }

    return json({ ok: true, invoiceId, docNumber });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
});
