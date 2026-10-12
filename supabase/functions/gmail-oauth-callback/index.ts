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
import { serviceClient } from "../_shared/auth.ts";
import { appUrl as configuredAppUrl } from "../_shared/config.ts";
import { consumeOAuthState } from "../_shared/oauth.ts";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";


Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const appUrl = configuredAppUrl();

  if (!code) {
    return Response.redirect(`${appUrl}/?gmail=error#/settings`, 302);
  }
  const sb = serviceClient();
  // The mailbox comes from the consumed state row (set by oauth-start), never from the URL.
  const st = await consumeOAuthState(sb, url.searchParams.get("state"), "gmail");
  const mailboxId = st && st.mailbox_id;
  if (!mailboxId) {
    console.error("Gmail OAuth callback: missing/invalid/expired state");
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

  // Confirm the mailbox row this state refers to actually exists before writing a token for it --
  // state is round-tripped by Google verbatim, but never trust it blindly.
  const { data: mailbox } = await sb.from("gmail_mailboxes").select("id, email").eq("id", mailboxId).maybeSingle();
  if (!mailbox) {
    console.error("Gmail OAuth callback: unknown mailbox id in state", mailboxId);
    return Response.redirect(`${appUrl}/?gmail=error#/settings`, 302);
  }
  // The Google account that consented must BE the mailbox being connected -- otherwise someone
  // could attach a different inbox to an artist's payment-matching mailbox.
  const profResp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  const profile = profResp.ok ? await profResp.json() : null;
  if (!profile?.emailAddress || String(profile.emailAddress).toLowerCase() !== String(mailbox.email || "").toLowerCase()) {
    console.error("Gmail OAuth callback: signed-in Google account does not match the mailbox", profile?.emailAddress, mailbox.email);
    return Response.redirect(`${appUrl}/?gmail=mismatch#/settings`, 302);
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
