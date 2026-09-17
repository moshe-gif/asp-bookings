// Sends a contract to a client by email. This function holds no email-sending credentials
// itself -- it verifies the caller is a real, logged-in ASP admin (same is_admin() RPC every
// other admin-only action in this app relies on), then forwards the already-rendered contract
// HTML to a Google Apps Script mail relay (see ops/apps-script-mail-relay.gs), which is the
// piece that actually calls Gmail's MailApp.sendEmail. Two layers of secrets: Supabase's own JWT
// verification (default on for this function) gates who can call it at all; RELAY_SECRET (a
// function secret, never sent to the browser) is what the relay uses to trust this function.
//
// Deploy: paste this file into Supabase Dashboard -> Edge Functions -> New Function
// ("send-contract-email") -> Deploy. Then set these Function Secrets in the same dashboard:
//   RELAY_URL    = the Google Apps Script Web App URL (ends in /exec)
//   RELAY_SECRET = the shared secret configured in that same script
//   REPLY_TO     = optional -- e.g. billing@aspmgmt.com, so client replies land at the office
// SUPABASE_URL / SUPABASE_ANON_KEY are already available to every Edge Function automatically.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

Deno.serve(async (req) => {
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

  let body: { to?: string; subject?: string; html?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "bad json" }, 400);
  }

  const { to, subject, html } = body || {};
  if (!to || !subject || !html) return json({ ok: false, error: "missing fields" }, 400);
  if (typeof to !== "string" || !EMAIL_RE.test(to)) {
    return json({ ok: false, error: "invalid recipient" }, 400);
  }
  if (html.length > 300000) return json({ ok: false, error: "contract html too large" }, 400);

  const relayUrl = Deno.env.get("RELAY_URL");
  const relaySecret = Deno.env.get("RELAY_SECRET");
  if (!relayUrl || !relaySecret) {
    return json({ ok: false, error: "email relay not configured yet" }, 500);
  }

  let relayResp: Response;
  try {
    relayResp = await fetch(relayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: relaySecret,
        to,
        subject,
        html,
        fromName: "ASP Management",
        replyTo: Deno.env.get("REPLY_TO") || undefined,
      }),
    });
  } catch (err) {
    return json({ ok: false, error: "could not reach mail relay: " + String(err) }, 502);
  }

  const relayJson = await relayResp.json().catch(() => ({ ok: false, error: "bad relay response" }));
  if (!relayResp.ok || !relayJson.ok) {
    return json({ ok: false, error: relayJson.error || "relay failed" }, 502);
  }
  return json({ ok: true });
});
