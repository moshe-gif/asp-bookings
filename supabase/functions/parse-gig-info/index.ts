// Gig Info drop-in (owner 2026-10-14): the office pastes what the band / planner sent -- text, or a
// PDF or image of their sheet -- and Claude pulls out the gig sheet: band, choir, other singers,
// start time, the run of the night, songs per moment, contacts. Admin-only; nothing is stored here
// (the browser saves what the office keeps). Needs ANTHROPIC_API_KEY.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin } from "../_shared/auth.ts";
// Pinned here, not in _shared/deps.ts, so only the functions that call Claude load the SDK.
import Anthropic from "npm:@anthropic-ai/sdk@0.130.0";

const MAX_TEXT = 20000;
const MAX_FILE_B64 = 7_000_000; // ~5 MB file
const FILE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"];

const str = (d: string) => ({ type: "string", description: d });
const schema = {
  type: "object", additionalProperties: false,
  required: ["band", "bandSize", "choir", "otherSingers", "startTime", "schedule", "songs", "contacts", "notes"],
  properties: {
    band: str("Band name, or empty"),
    bandSize: str("Number of musicians as digits, or empty"),
    choir: str("Choir name, or empty"),
    otherSingers: { type: "array", items: { type: "string" }, description: "Other singers / performers at the event (names)" },
    startTime: str("When the artist starts / call time as 24h HH:MM, or empty"),
    schedule: { type: "array", description: "The run of the event in order", items: { type: "object", additionalProperties: false, required: ["time", "item"], properties: { time: str("24h HH:MM or empty"), item: str("What happens") } } },
    songs: { type: "array", description: "Songs requested, by moment (e.g. Chuppah - walking down, Kallah, First dance)", items: { type: "object", additionalProperties: false, required: ["moment", "song"], properties: { moment: str("The moment, or empty"), song: str("Song title") } } },
    contacts: { type: "array", description: "People to reach on the day", items: { type: "object", additionalProperties: false, required: ["name", "role", "phone", "email"], properties: { name: str("Name"), role: str("Role, e.g. Bandleader, Planner, Father of the bride"), phone: str("Phone or empty"), email: str("Email or empty") } } },
    notes: str("Anything else the artist should know (dress, sound, parking, Hebrew names), short; or empty"),
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ ok: false, error: "AI gig sheets aren't set up yet (ANTHROPIC_API_KEY secret missing)." }, 503);

  // deno-lint-ignore no-explicit-any
  const body = await readJson<any>(req);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const file = body?.file && typeof body.file.data === "string" && FILE_TYPES.includes(body.file.mediaType) ? body.file : null;
  if (!text && !file) return json({ ok: false, error: "Paste the band's info or attach their file first." }, 400);
  if (text.length > MAX_TEXT) return json({ ok: false, error: "That text is too long." }, 400);
  if (file && file.data.length > MAX_FILE_B64) return json({ ok: false, error: "That file is too big (5 MB max)." }, 400);

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (file) {
    content.push(file.mediaType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: file.data } }
      : { type: "image", source: { type: "base64", media_type: file.mediaType, data: file.data } });
  }
  content.push({ type: "text", text: text ? `<band_info>\n${text}\n</band_info>` : "The band's info is in the attached file." });

  const client = new Anthropic({ apiKey });
  let response;
  try {
    response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema } },
      system: "You turn what a band or event planner sent ASP Management (a Jewish music artist agency) into a clear gig " +
        "sheet for the singer. Use only what the information says; leave fields empty rather than guess. Keep song titles and " +
        "Hebrew/Yiddish names as written.",
      messages: [{ role: "user", content }],
    });
  } catch (err) {
    const status = err instanceof Anthropic.APIError ? err.status : 0;
    return json({ ok: false, error: status === 429 ? "AI is busy, try again in a minute." : "Reading the gig info failed: " + String((err as Error)?.message || err) }, 502);
  }
  if (response.stop_reason === "refusal") return json({ ok: false, error: "The AI declined to read that." }, 422);
  const block = response.content.find((b) => b.type === "text");
  try {
    const sheet = JSON.parse(block && block.type === "text" ? block.text : "");
    return json({ ok: true, sheet });
  } catch {
    return json({ ok: false, error: "AI returned an unreadable answer; try again." }, 502);
  }
});
