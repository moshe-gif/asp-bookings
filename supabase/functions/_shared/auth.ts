// Who is calling, and the service-role client (2026-10-09 audit 5.6: this block was copied into
// every function).
import { createClient, type SupabaseClient, type User } from "./deps.ts";
import type { Json } from "./http.ts";

// Full-access client for server-side reads/writes. Never returned to the browser.
export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

// The signed-in caller, required to be an ASP admin (the same is_admin() RPC as RLS). Returns the
// user and a client acting AS them, or the 401/403 response to send back.
//   const auth = await requireAdmin(req, json); if (auth instanceof Response) return auth;
export async function requireAdmin(req: Request, json: Json): Promise<{ user: User; caller: SupabaseClient } | Response> {
  const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
  });
  const { data: { user }, error: userErr } = await caller.auth.getUser();
  if (userErr || !user) return json({ ok: false, error: "not authenticated" }, 401);
  const { data: isAdmin, error: adminErr } = await caller.rpc("is_admin");
  if (adminErr || !isAdmin) return json({ ok: false, error: "not authorized" }, 403);
  return { user, caller };
}
