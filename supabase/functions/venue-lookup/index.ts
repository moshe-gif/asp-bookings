// Finds a venue's address from its name (owner 2026-10-29: "why does it not auto fill address" -- typing
// "rockliegh" left the address empty because only venues saved before were known). Claude searches the web
// for the hall (misspellings fine: "rockliegh" -> The Rockleigh) and returns its proper name and address.
// Admin-only; only the venue name (and an optional city hint) is sent. The office checks the result.
// Secret: ANTHROPIC_API_KEY.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin } from "../_shared/auth.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.130.0";

const FIELDS = {
  found: "yes when one specific real venue clearly matches, else no",
  name: "The venue's proper name as it calls itself (fix the spelling), or empty",
  address: "Street address (number and street only), or empty",
  city: "City or town, or empty",
  state: "US state 2-letter code (or region/country if abroad), or empty",
  zip: "ZIP / postal code, or empty",
} as const;
const schema = {
  type: "object", additionalProperties: false, required: Object.keys(FIELDS),
  properties: Object.fromEntries(Object.entries(FIELDS).map(([k, d]) => [k, { type: "string", description: d }])),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ ok: false, error: "Venue lookup isn't set up (ANTHROPIC_API_KEY missing)." }, 503);
  // deno-lint-ignore no-explicit-any
  const b = await readJson<any>(req);
  const venue = String(b?.venue || "").trim().slice(0, 120);
  const hint = String(b?.city || "").trim().slice(0, 80);
  if (venue.length < 3) return json({ ok: false, error: "Type the venue's name first." }, 400);

  const client = new Anthropic({ apiKey });
  let response;
  try {
    response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 3000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema } },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
      system: "You find the address of an event venue (wedding hall, catering hall, hotel, shul, ballroom) for ASP " +
        "Management, a Jewish music agency booking gigs mostly in the New York / New Jersey area. The name may be " +
        "misspelled or shortened. Search the web, pick the one venue it clearly means, and give its proper name and " +
        "street address. If it's ambiguous or you can't find it, answer found=no.",
      messages: [{ role: "user", content: `Venue: ${venue}${hint ? `\nCity (may be empty or rough): ${hint}` : ""}` }],
    });
  } catch (err) {
    const status = err instanceof Anthropic.APIError ? err.status : 0;
    return json({ ok: false, error: status === 429 ? "Busy, try again in a minute." : "Lookup failed: " + String((err as Error)?.message || err) }, 502);
  }
  const texts = response.content.filter((x) => x.type === "text");
  const last = texts[texts.length - 1];
  let f: Record<string, string>;
  try { f = JSON.parse(last && last.type === "text" ? last.text : ""); } catch { return json({ ok: false, error: "Couldn't read the answer; try again." }, 502); }
  if (f.found !== "yes" || !f.address) return json({ ok: true, found: false });
  const out: Record<string, string> = {};
  for (const k of ["name", "address", "city", "state", "zip"]) out[k] = String(f[k] || "").trim().slice(0, 200);
  return json({ ok: true, found: true, venue: out });
});
