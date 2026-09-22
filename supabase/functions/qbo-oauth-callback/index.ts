// Handles the redirect Intuit sends back after an admin authorizes ASP's QuickBooks connection.
// This endpoint is necessarily public/unauthenticated (it's a browser redirect from Intuit, not
// an app API call) -- its real security boundary is Intuit's own OAuth consent screen plus the
// fact that the "code" it receives is single-use and short-lived. Deploy this with JWT
// verification turned OFF (Supabase Dashboard -> this function -> Settings -> "Enforce JWT
// Verification" off), since Intuit's redirect carries no Supabase auth token.
//
// Function Secrets needed: QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_REDIRECT_URI (must exactly match
// what's registered in the Intuit Developer app), APP_URL (e.g. https://app.aspmgmt.com).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const realmId = url.searchParams.get("realmId");
  const appUrl = Deno.env.get("APP_URL") || "https://app.aspmgmt.com";

  if (!code || !realmId) {
    return Response.redirect(`${appUrl}/?qbo=error#/settings`, 302);
  }

  const clientId = Deno.env.get("QBO_CLIENT_ID")!;
  const clientSecret = Deno.env.get("QBO_CLIENT_SECRET")!;
  const redirectUri = Deno.env.get("QBO_REDIRECT_URI")!;
  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  let tokenResp: Response;
  try {
    tokenResp = await fetch(QBO_TOKEN_URL, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
  } catch (err) {
    console.error("QBO token exchange request failed", err);
    return Response.redirect(`${appUrl}/?qbo=error#/settings`, 302);
  }

  if (!tokenResp.ok) {
    console.error("QBO token exchange failed", await tokenResp.text());
    return Response.redirect(`${appUrl}/?qbo=error#/settings`, 302);
  }

  const tokens = await tokenResp.json();
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const accessExpires = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  const refreshExpires = new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000).toISOString();

  const { error: dbErr } = await sb.from("qbo_connection").upsert({
    id: 1,
    realm_id: realmId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    access_token_expires_at: accessExpires,
    refresh_token_expires_at: refreshExpires,
    updated_at: new Date().toISOString(),
  });

  if (dbErr) {
    console.error("QBO connection save failed", dbErr);
    return Response.redirect(`${appUrl}/?qbo=error#/settings`, 302);
  }

  return Response.redirect(`${appUrl}/?qbo=connected#/settings`, 302);
});
