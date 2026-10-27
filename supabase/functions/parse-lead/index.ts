// New Lead "paste a message" auto-fill (owner 2026-10-13): the office pastes a client's WhatsApp /
// email message and Claude pulls out the lead fields. Admin-only. The pasted text is sent to the
// Anthropic API and nowhere else; nothing is stored. The browser fills the form and the office
// reviews it before saving -- this only suggests values.
//
// Secret: ANTHROPIC_API_KEY (Supabase -> Edge Functions -> Secrets). Without it the function says so.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";
import { MAX_TEXT, parseLeadText } from "../_shared/leadparse.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ ok: false, error: "AI auto-fill isn't set up yet (ANTHROPIC_API_KEY secret missing)." }, 503);

  // deno-lint-ignore no-explicit-any
  const body = await readJson<any>(req);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return json({ ok: false, error: "Paste a message first." }, 400);
  if (text.length > MAX_TEXT) return json({ ok: false, error: `That message is too long (max ${MAX_TEXT} characters).` }, 400);
  const today = /^\d{4}-\d{2}-\d{2}$/.test(body?.today || "") ? body.today : new Date().toISOString().slice(0, 10);
  const eventTypes: string[] = Array.isArray(body?.eventTypes) ? body.eventTypes.filter((t: unknown) => typeof t === "string").slice(0, 30) : [];

  const { data: roster } = await serviceClient().from("artists").select("name").order("name");
  const artistNames = (roster || []).map((r: { name: string }) => r.name);

  const parsed = await parseLeadText(apiKey, text, today, eventTypes, artistNames);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, parsed.status);
  return json({ ok: true, fields: parsed.fields });
});
