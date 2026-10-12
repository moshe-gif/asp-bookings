// QuickBooks Online access shared by qbo-create-invoice and qbo-webhook: the stored connection
// (qbo_connection, one row), refreshing its access token when it is about to expire.
// Secrets: QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_ENVIRONMENT ("sandbox" | production by default).
import { serviceClient } from "./auth.ts";

export const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

export function qboApiBase(): string {
  return Deno.env.get("QBO_ENVIRONMENT") === "sandbox"
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";
}

export async function qboAccessToken(): Promise<{ accessToken: string; realmId: string }> {
  const sb = serviceClient();
  const { data: row, error } = await sb.from("qbo_connection").select("*").eq("id", 1).maybeSingle();
  if (error || !row) throw new Error("QuickBooks is not connected yet -- connect it in Settings first.");

  if (new Date(row.access_token_expires_at).getTime() - Date.now() > 60_000) {
    return { accessToken: row.access_token, realmId: row.realm_id };
  }
  const basicAuth = btoa(`${Deno.env.get("QBO_CLIENT_ID")!}:${Deno.env.get("QBO_CLIENT_SECRET")!}`);
  const resp = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: { "Authorization": `Basic ${basicAuth}`, "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
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

// A QuickBooks API call for the connected company (path starts at /v3/company/<realm>).
export async function qboFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { accessToken, realmId } = await qboAccessToken();
  return fetch(`${qboApiBase()}/v3/company/${realmId}${path}`, {
    ...init,
    headers: { ...(init.headers || {}), "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" },
  });
}
