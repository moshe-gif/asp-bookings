// Handles the redirect Google sends back after an admin authorizes ASP's Google Calendar
// connection. Necessarily public/unauthenticated (a browser redirect from Google, not an app API
// call) -- its real security boundary is Google's own OAuth consent screen plus the fact that the
// "code" it receives is single-use and short-lived. Deploy this with JWT verification turned OFF
// (Supabase Dashboard -> this function -> Settings -> "Enforce JWT Verification" off), since
// Google's redirect carries no Supabase auth token. Mirrors qbo-oauth-callback's structure exactly.
//
// Function Secrets needed: GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET,
// GOOGLE_CALENDAR_REDIRECT_URI (must exactly match what's registered in Google Cloud Console),
// APP_URL (e.g. https://app.aspmgmt.com).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// One-time OAuth `state` issued by the oauth-start function to a signed-in admin (migration 0034).
// Consumed here before anything else: an unknown, reused, expired or wrong-provider state is
// rejected, so nobody can complete a connect flow ASP didn't start or attach their own account
// to ASP's connection (2026-10-09 audit 1.2).
async function consumeOAuthState(sb: any, state: string | null, provider: string) {
  if (!state) return null;
  const { data, error } = await sb.from("oauth_states").delete()
    .eq("nonce", state).eq("provider", provider).gt("expires_at", new Date().toISOString())
    .select("user_id, mailbox_id").maybeSingle();
  if (error) { console.error("OAuth state check failed", error); return null; }
  return data;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const appUrl = Deno.env.get("APP_URL") || "https://app.aspmgmt.com";

  if (!code) {
    return Response.redirect(`${appUrl}/?gcal=error#/settings`, 302);
  }
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  if (!(await consumeOAuthState(sb, url.searchParams.get("state"), "gcal"))) {
    console.error("Google Calendar OAuth callback: missing/invalid/expired state");
    return Response.redirect(`${appUrl}/?gcal=error#/settings`, 302);
  }

  const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!;
  const redirectUri = Deno.env.get("GOOGLE_CALENDAR_REDIRECT_URI")!;

  let tokenResp: Response;
  try {
    tokenResp = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
  } catch (err) {
    console.error("Google Calendar token exchange request failed", err);
    return Response.redirect(`${appUrl}/?gcal=error#/settings`, 302);
  }

  if (!tokenResp.ok) {
    console.error("Google Calendar token exchange failed", await tokenResp.text());
    return Response.redirect(`${appUrl}/?gcal=error#/settings`, 302);
  }

  const tokens = await tokenResp.json();

  let email: string | null = null;
  try {
    const userResp = await fetch(GOOGLE_USERINFO_URL, {
      headers: { "Authorization": `Bearer ${tokens.access_token}` },
    });
    if (userResp.ok) email = (await userResp.json()).email || null;
  } catch (err) {
    console.error("Google Calendar userinfo lookup failed (non-fatal)", err);
  }

  const accessExpires = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error: dbErr } = await sb.from("gcal_connection").upsert({
    id: 1,
    google_account_email: email,
    access_token: tokens.access_token,
    // Google only returns a refresh_token on the FIRST consent (or when prompt=consent is forced)
    // -- keep the previously stored one on a reconnect that doesn't get a fresh one.
    ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
    access_token_expires_at: accessExpires,
    updated_at: new Date().toISOString(),
  });

  if (dbErr) {
    console.error("Google Calendar connection save failed", dbErr);
    return Response.redirect(`${appUrl}/?gcal=error#/settings`, 302);
  }

  return Response.redirect(`${appUrl}/?gcal=connected#/settings`, 302);
});
