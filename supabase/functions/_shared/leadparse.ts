// Booking-message -> lead fields with Claude, shared by parse-lead (the New Lead "Fill from message"
// button) and intake-lead (chat intake, 2026-10-23) so both read a message the same way: only what the
// message says, empty rather than a guess, and only known types / roster artists / well-formed values.
// Only these two functions import this file, so only they load the SDK.
import Anthropic from "npm:@anthropic-ai/sdk@0.130.0";

export const MAX_TEXT = 6000;
// The app's EVENT_TYPES (asp.js), for callers that don't send their own list.
export const DEFAULT_EVENT_TYPES = ["Wedding", "Bar Mitzvah", "Sheva Brachos", "Concert", "Melave Malka", "Chinese Auction", "Private Simcha", "Other"];

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
export type LeadFields = Record<keyof typeof FIELDS, string>;

const schema = {
  type: "object",
  additionalProperties: false,
  required: Object.keys(FIELDS),
  properties: Object.fromEntries(Object.entries(FIELDS).map(([k, d]) => [k, { type: "string", description: d }])),
};

export type ParseResult = { ok: true; fields: LeadFields } | { ok: false; error: string; status: number };

export async function parseLeadText(apiKey: string, text: string, today: string, eventTypes: string[], artistNames: string[]): Promise<ParseResult> {
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
    return { ok: false, status: 502, error: status === 429 ? "AI is busy, try again in a minute." : "AI auto-fill failed: " + String((err as Error)?.message || err) };
  }
  if (response.stop_reason === "refusal") return { ok: false, status: 422, error: "The AI declined to read that message." };
  const block = response.content.find((b) => b.type === "text");
  let fields: Record<string, string>;
  try { fields = JSON.parse(block && block.type === "text" ? block.text : ""); }
  catch { return { ok: false, status: 502, error: "AI returned an unreadable answer; try again." }; }

  // Keep only known keys and allowed values.
  const out = {} as LeadFields;
  for (const k of Object.keys(FIELDS) as (keyof LeadFields)[]) out[k] = typeof fields[k] === "string" ? fields[k].trim().slice(0, 300) : "";
  if (out.type && eventTypes.length && !eventTypes.includes(out.type)) out.type = "";
  if (out.artistName && !artistNames.includes(out.artistName)) out.artistName = "";
  if (out.date && !/^\d{4}-\d{2}-\d{2}$/.test(out.date)) out.date = "";
  for (const k of ["time", "endTime"] as const) if (out[k] && !/^\d{2}:\d{2}$/.test(out[k])) out[k] = "";
  if (out.price && !/^\d+(\.\d+)?$/.test(out.price.replace(/[$,]/g, ""))) out.price = "";
  out.price = out.price.replace(/[$,]/g, "");
  return { ok: true, fields: out };
}
