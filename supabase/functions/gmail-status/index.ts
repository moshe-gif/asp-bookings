// Returns every registered Gmail mailbox with its connection status, without exposing any tokens
// -- gmail_oauth_tokens has no client-facing RLS policies, so this thin admin-gated read is the
// only way the Settings page finds out which mailboxes are actually connected.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Called directly via fetch() from the browser -- without these headers the browser's CORS
// preflight (an automatic OPTIONS request before any cross-origin POST carrying custom headers
// like apikey/Content-Type) fails with no server-visible error; the app just sees "Failed to
// fetch". Same fix as send-contract-email/index.ts.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
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

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
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
