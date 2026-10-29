// Issues the one-time OAuth `state` for connecting QuickBooks / Google Calendar / a Gmail mailbox / Google Drive
// (2026-10-09 audit 1.2). Only a signed-in admin can get one; it is stored server-side
// (oauth_states, migration 0034, service-role only) for 10 minutes and consumed by the matching
// *-oauth-callback, which rejects any state it didn't issue.
//
// Deploy with "Enforce JWT Verification" ON. Secrets: SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY (the defaults every function already has).
import { jsonFor, preflight } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);

  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  let body: { provider?: string; mailboxId?: string };
  try { body = await req.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
  const provider = body?.provider;
  if (!provider || !["qbo", "gcal", "gmail", "gdrive"].includes(provider)) return json({ ok: false, error: "unknown provider" }, 400);

  // Google Drive backup of the Video Library (0074): only the people who run the library.
  if (provider === "gdrive") {
    const { data: ok } = await auth.caller.rpc("is_library_admin");
    if (!ok) return json({ ok: false, error: "not authorized" }, 403);
  }

  const sb = serviceClient();
  let mailboxId: string | null = null;
  if (provider === "gmail") {
    const { data: mailbox } = await sb.from("gmail_mailboxes").select("id").eq("id", body.mailboxId || "").maybeSingle();
    if (!mailbox) return json({ ok: false, error: "unknown mailbox" }, 400);
    mailboxId = mailbox.id;
  }

  await sb.from("oauth_states").delete().lt("expires_at", new Date().toISOString()); // housekeeping
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const nonce = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const { error } = await sb.from("oauth_states").insert({
    nonce, provider, user_id: user.id, mailbox_id: mailboxId,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  if (error) return json({ ok: false, error: "could not start the connection" }, 500);
  return json({ ok: true, state: nonce });
});
