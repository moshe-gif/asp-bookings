// Returns whether QuickBooks is connected, without exposing any tokens -- the qbo_connection
// table itself has no client-facing RLS policies at all, so the Settings page needs this thin,
// admin-gated read instead of querying the table directly.
import { jsonFor, preflight } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;

  const sb = serviceClient();
  const { data: row } = await sb.from("qbo_connection").select("realm_id, connected_at").eq("id", 1).maybeSingle();

  return json({ ok: true, connected: !!row, realmId: row?.realm_id || null, connectedAt: row?.connected_at || null });
});
