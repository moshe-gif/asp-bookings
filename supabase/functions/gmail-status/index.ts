// Returns every registered Gmail mailbox with its connection status, without exposing any tokens
// -- gmail_oauth_tokens has no client-facing RLS policies, so this thin admin-gated read is the
// only way the Settings page finds out which mailboxes are actually connected.
import { jsonFor, preflight } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;

  const sb = serviceClient();
  const { data: mailboxes, error } = await sb.from("gmail_mailboxes").select("id, mailbox_type, artist_id, email, watch_expires_at").order("email");
  if (error) return json({ ok: false, error: error.message }, 500);

  const { data: tokens } = await sb.from("gmail_oauth_tokens").select("gmail_mailbox_id, connected_at");
  const connectedIds = new Map((tokens || []).map((t: any) => [t.gmail_mailbox_id, t.connected_at]));

  return json({
    ok: true,
    mailboxes: (mailboxes || []).map((m: any) => ({
      ...m,
      connected: connectedIds.has(m.id),
      connectedAt: connectedIds.get(m.id) || null,
    })),
  });
});
