// Removes a person from ASP Bookings (Settings → Users → Edit → Remove). Admin-only.
// - Deletes their Supabase login (auth user: ends their sessions, passkeys and sign-in codes).
// - Deletes their roster row (admin_users / artists). An artist who still has bookings,
//   contracts or payee profiles referencing them stays on the roster (so history keeps its
//   artist) but with no login -- the response says so.
// - Refuses to remove yourself, or the last office admin.
//
// Deploy with "Enforce JWT Verification" ON. Uses the default SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY secrets.
import { jsonFor, preflight } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);

  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  let body: { kind?: string; rosterId?: string };
  try { body = await req.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
  const table = body?.kind === "admin" ? "admin_users" : body?.kind === "artist" ? "artists" : null;
  if (!table || !body.rosterId) return json({ ok: false, error: "kind (admin|artist) and rosterId are required" }, 400);

  const sb = serviceClient();
  const { data: row, error: rowErr } = await sb.from(table).select("id, name, user_id").eq("id", body.rosterId).maybeSingle();
  if (rowErr) return json({ ok: false, error: rowErr.message }, 500);
  if (!row) return json({ ok: false, error: "that person no longer exists" }, 404);
  if (row.user_id && row.user_id === user.id) return json({ ok: false, error: "you can't remove yourself" }, 400);
  if (table === "admin_users") {
    const { count } = await sb.from("admin_users").select("id", { count: "exact", head: true });
    if ((count ?? 0) <= 1) return json({ ok: false, error: "can't remove the last office admin" }, 400);
  }

  // 1) The login. A missing auth user (already deleted) is fine.
  if (row.user_id) {
    const { error: delAuthErr } = await sb.auth.admin.deleteUser(row.user_id);
    if (delAuthErr && !/not.?found/i.test(delAuthErr.message)) return json({ ok: false, error: `could not remove the login: ${delAuthErr.message}` }, 500);
  }

  // 2) The roster row -- unless history still points at it.
  const { error: delRowErr } = await sb.from(table).delete().eq("id", row.id);
  if (delRowErr) {
    if (delRowErr.code === "23503") {
      await sb.from(table).update({ user_id: null }).eq("id", row.id);
      return json({ ok: true, removed: "login", note: `${row.name}'s login was removed. They stay on the roster because existing bookings or contracts reference them.` });
    }
    return json({ ok: false, error: `login removed, but the roster entry could not be: ${delRowErr.message}` }, 500);
  }
  return json({ ok: true, removed: "person", note: `${row.name} was removed from ASP Bookings.` });
});
