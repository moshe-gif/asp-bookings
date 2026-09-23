// Handles the redirect Google sends back after a mailbox owner (an artist authorizing their own
// inbox, or whoever holds the ASP-sending mailbox) authorizes read access for Zelle payment
// matching (item 6) or sending (item 7). Unlike gcal-oauth-callback (one ASP-wide connection),
// this can be for ANY of potentially several mailboxes -- which one is carried in the OAuth
// `state` param as the gmail_mailboxes row id, set when the Connect link was built
// (gmailAuthorizeUrl(mailboxId) in frontend/workspaces/asp.js).
//
// Necessarily public/unauthenticated (a browser redirect from Google) -- deploy with JWT
// verification OFF. Function Secrets needed: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET,
// GMAIL_REDIRECT_URI, APP_URL.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const mailboxId = url.searchParams.get("state");
  const appUrl = Deno.env.get("APP_URL") || "https://app.aspmgmt.com";

  if (!code || !mailboxId) {
    return Response.redirect(`${appUrl}/?gmail=error#/settings`, 302);
  }

  const clientId = Deno.env.get("GMAIL_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET")!;
  const redirectUri = Deno.env.get("GMAIL_REDIRECT_URI")!;

  let tokenResp: Response;
  try {
    tokenResp = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: "authorization_code",
      }),
    });
  } catch (err) {
    console.error("Gmail token exchange request failed", err);
    return Response.redirect(`${appUrl}/?gmail=error#/settings`, 302);
  }

  if (!tokenResp.ok) {
    console.error("Gmail token exchange failed", await tokenResp.text());
    return Response.redirect(`${appUrl}/?gmail=error#/settings`, 302);
  }

  const tokens = await tokenResp.json();
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Confirm the mailbox row this state refers to actually exists before writing a token for it --
  // state is round-tripped by Google verbatim, but never trust it blindly.
  const { data: mailbox } = await sb.from("gmail_mailboxes").select("id").eq("id", mailboxId).maybeSingle();
  if (!mailbox) {
    console.error("Gmail OAuth callback: unknown mailbox id in state", mailboxId);
    return Response.redirect(`${appUrl}/?gmail=error#/settings`, 302);
  }

  const accessExpires = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  const { error: dbErr } = await sb.from("gmail_oauth_tokens").upsert({
    gmail_mailbox_id: mailboxId,
    access_token: tokens.access_token,
    ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
    access_token_expires_at: accessExpires,
    updated_at: new Date().toISOString(),
  }, { onConflict: "gmail_mailbox_id" });

  if (dbErr) {
    console.error("Gmail connection save failed", dbErr);
    return Response.redirect(`${appUrl}/?gmail=error#/settings`, 302);
  }

  return Response.redirect(`${appUrl}/?gmail=connected#/settings`, 302);
});
