// Read-only feed for Axis, the owner's personal planner (owner OK 2026-11-09: "auto proceed on all these items").
// Axis reads the office WhatsApp to suggest tasks ("You said you'd…"). This function ONLY reads
// whatsapp_messages: text messages, newest 200 after a timestamp, never older than 2 days. It writes nothing.
// Public (Axis has no ASP sign-in), so it trusts only requests carrying AXIS_FEED_KEY (a long random secret set
// in both projects). Deploy: supabase functions deploy axis-feed --no-verify-jwt
import { serviceClient } from "../_shared/auth.ts";

const MAX_AGE_MS = 2 * 86400e3;

Deno.serve(async (req) => {
  const key = Deno.env.get("AXIS_FEED_KEY");
  if (req.method !== "GET" || !key || key.length < 32 || req.headers.get("x-axis-key") !== key) return new Response("forbidden", { status: 403 });
  const floor = new Date(Date.now() - MAX_AGE_MS).toISOString();
  const asked = new URL(req.url).searchParams.get("after") || floor;
  const after = asked > floor ? asked : floor;
  const { data, error } = await serviceClient().from("whatsapp_messages")
    .select("id, direction, contact, contact_name, body, created_at")
    .eq("kind", "text").gt("created_at", after).order("created_at", { ascending: true }).limit(200);
  if (error) return new Response(JSON.stringify({ error: "read failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  return new Response(JSON.stringify({ messages: data ?? [] }), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
});
