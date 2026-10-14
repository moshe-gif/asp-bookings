// Travel confirmations -> itinerary data (owner 2026-10-14): the office (Rivky) drops in the flight /
// hotel / car confirmations the concierge sent -- PDFs, screenshots or pasted text -- and Claude pulls
// out every flight, hotel and ground transfer. Admin-only; nothing is stored here (the browser saves
// what the office approves). Needs ANTHROPIC_API_KEY.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin } from "../_shared/auth.ts";
// Pinned here, not in _shared/deps.ts, so only the functions that call Claude load the SDK.
import Anthropic from "npm:@anthropic-ai/sdk@0.130.0";

const MAX_TEXT = 30000;
const MAX_FILES = 6;
const MAX_TOTAL_B64 = 14_000_000; // ~10 MB across files
const FILE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"];

const str = (d: string) => ({ type: "string", description: d });
const obj = (fields: Record<string, string>) => ({
  type: "object", additionalProperties: false, required: Object.keys(fields),
  properties: Object.fromEntries(Object.entries(fields).map(([k, d]) => [k, str(d)])),
});
const schema = {
  type: "object", additionalProperties: false, required: ["flights", "hotels", "ground", "notes"],
  properties: {
    flights: { type: "array", items: obj({
      passenger: "Passenger name as on the ticket, or empty", airline: "Airline", flightNumber: "Flight number with airline code, e.g. DL1234",
      confirmation: "Booking / record locator, or empty", departAirport: "IATA code of departure airport", arriveAirport: "IATA code of arrival airport",
      departAt: "Local departure date-time YYYY-MM-DDTHH:MM", arriveAt: "Local arrival date-time YYYY-MM-DDTHH:MM, or empty",
      cabin: "Cabin / class, or empty", seat: "Seat, or empty",
    }) },
    hotels: { type: "array", items: obj({
      name: "Hotel name", address: "Address, or empty", phone: "Phone, or empty", checkIn: "Check-in date YYYY-MM-DD", checkOut: "Check-out date YYYY-MM-DD, or empty",
      confirmation: "Confirmation number, or empty", guest: "Guest name, or empty",
    }) },
    ground: { type: "array", items: obj({
      company: "Car service, or empty", driver: "Driver name, or empty", phone: "Phone, or empty", pickupAt: "Pickup date-time YYYY-MM-DDTHH:MM, or empty",
      pickupLocation: "Pickup place, or empty", dropoffLocation: "Drop-off place, or empty", confirmation: "Confirmation number, or empty",
    }) },
    notes: str("Anything else the traveler should know (baggage, check-in rules, concierge contact), short; or empty"),
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ ok: false, error: "AI travel reading isn't set up yet (ANTHROPIC_API_KEY secret missing)." }, 503);

  // deno-lint-ignore no-explicit-any
  const body = await readJson<any>(req);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  // deno-lint-ignore no-explicit-any
  const files = (Array.isArray(body?.files) ? body.files : []).filter((f: any) => f && typeof f.data === "string" && FILE_TYPES.includes(f.mediaType));
  if (!text && !files.length) return json({ ok: false, error: "Attach the confirmations or paste their text first." }, 400);
  if (files.length > MAX_FILES) return json({ ok: false, error: `At most ${MAX_FILES} files at a time.` }, 400);
  // deno-lint-ignore no-explicit-any
  if (files.reduce((n: number, f: any) => n + f.data.length, 0) > MAX_TOTAL_B64) return json({ ok: false, error: "Those files are too big together (10 MB max)." }, 400);
  if (text.length > MAX_TEXT) return json({ ok: false, error: "That text is too long." }, 400);

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  // deno-lint-ignore no-explicit-any
  for (const f of files as any[]) {
    content.push(f.mediaType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data } }
      : { type: "image", source: { type: "base64", media_type: f.mediaType, data: f.data } });
  }
  content.push({ type: "text", text: text ? `<confirmations>\n${text}\n</confirmations>` : "The travel confirmations are attached." });

  const client = new Anthropic({ apiKey });
  let response;
  try {
    response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 6000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema } },
      system: "You read travel confirmations (flights, hotels, car service) for a touring singer and list every booking " +
        "exactly as confirmed. Times are local to each airport or place. Use only what the documents say; leave fields empty rather than guess.",
      messages: [{ role: "user", content }],
    });
  } catch (err) {
    const status = err instanceof Anthropic.APIError ? err.status : 0;
    return json({ ok: false, error: status === 429 ? "AI is busy, try again in a minute." : "Reading the confirmations failed: " + String((err as Error)?.message || err) }, 502);
  }
  if (response.stop_reason === "refusal") return json({ ok: false, error: "The AI declined to read those files." }, 422);
  const block = response.content.find((b) => b.type === "text");
  try {
    return json({ ok: true, travel: JSON.parse(block && block.type === "text" ? block.text : "") });
  } catch {
    return json({ ok: false, error: "AI returned an unreadable answer; try again." }, 502);
  }
});
