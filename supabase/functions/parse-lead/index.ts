// New Lead "paste a message" auto-fill (owner 2026-10-13): the office pastes a client's WhatsApp /
// email message and Claude pulls out the lead fields. Admin-only. The pasted text is sent to the
// Anthropic API and nowhere else; nothing is stored. The browser fills the form and the office
// reviews it before saving -- this only suggests values.
//
// Secret: ANTHROPIC_API_KEY (Supabase -> Edge Functions -> Secrets). Without it the function says so.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";
// Pinned here, not in _shared/deps.ts, so only this function loads the SDK.
import Anthropic from "npm:@anthropic-ai/sdk@0.130.0";

const MAX_TEXT = 6000;

const FIELDS = {
  clientName: "Client's full name (the person booking), or empty",
  clientEmail: "Client email, or empty",
  clientPhone: "Client phone as written (digits, dashes ok), or empty",
  date: "Event date as YYYY-MM-DD, or empty. A date with no year is the next such date on or after today",
  time: "Start time as 24h HH:MM, or empty",
  endTime: "End time as 24h HH:MM, or empty",
  type: "Event type, exactly one of the allowed types, or empty",
  artistName: "The roster artist the message asks for, exactly as in the roster list, or empty",
  venue: "Venue / hall name, or empty",
  city: "City, or empty",
  state: "US state 2-letter code (or region/country if abroad), or empty",
  price: "Agreed price in dollars as a plain number string like 4500, or empty",
  notes: "Anything else useful for the booking (band, timing, requests), short, or empty",
} as const;

const schema = {
  type: "object",
  additionalProperties: false,
  required: Object.keys(FIELDS),
  properties: Object.fromEntries(Object.entries(FIELDS).map(([k, d]) => [k, { type: "string", description: d }])),
};

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

  const client = new Anthropic({ apiKey });
  let response;
  try {
    response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema } },
      system: "You extract booking-lead details for ASP Management, a Jewish music artist agency, from a pasted " +
        "message (often a forwarded WhatsApp chat). Only use what the message says; leave a field empty rather than guess. " +
        `Today is ${today}. Allowed event types: ${eventTypes.join(", ") || "Wedding, Bar Mitzvah, Other"}. ` +
        `Roster artists: ${artistNames.join(", ") || "(none)"}. A bare number like 4500 next to the booking is the price.`,
      messages: [{ role: "user", content: `<message>\n${text}\n</message>` }],
    });
  } catch (err) {
    const status = err instanceof Anthropic.APIError ? err.status : 0;
    return json({ ok: false, error: status === 429 ? "AI is busy, try again in a minute." : "AI auto-fill failed: " + String((err as Error)?.message || err) }, 502);
  }
  if (response.stop_reason === "refusal") return json({ ok: false, error: "The AI declined to read that message." }, 422);
  const block = response.content.find((b) => b.type === "text");
  let fields: Record<string, string>;
  try { fields = JSON.parse(block && block.type === "text" ? block.text : ""); }
  catch { return json({ ok: false, error: "AI returned an unreadable answer; try again." }, 502); }

  // Keep only known keys and allowed values.
  const out: Record<string, string> = {};
  for (const k of Object.keys(FIELDS)) out[k] = typeof fields[k] === "string" ? fields[k].trim().slice(0, 300) : "";
  if (out.type && eventTypes.length && !eventTypes.includes(out.type)) out.type = "";
  if (out.artistName && !artistNames.includes(out.artistName)) out.artistName = "";
  if (out.date && !/^\d{4}-\d{2}-\d{2}$/.test(out.date)) out.date = "";
  for (const k of ["time", "endTime"]) if (out[k] && !/^\d{2}:\d{2}$/.test(out[k])) out[k] = "";
  if (out.price && !/^\d+(\.\d+)?$/.test(out.price.replace(/[$,]/g, ""))) out.price = "";
  out.price = out.price.replace(/[$,]/g, "");
  return json({ ok: true, fields: out });
});
