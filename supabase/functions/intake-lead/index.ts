// Chat intake (owner 2026-10-23): a booking message dropped in from outside the app becomes a NEW LEAD
// for the office to review -- the same 4-5 line message the office pastes into New Lead -> "Fill from
// message", read by the same extraction (_shared/leadparse.ts). PREPARED ONLY: nothing calls this yet;
// pointing a chat tool at it is a separate, later step (ops/INTAKE_SETUP.md).
//
//   POST { text, idempotency_key }   header x-intake-secret: <INTAKE_SECRET>
//   -> { ok: true, id: "EV-5201", open: "#/needs_review", created: true|false }
//
// Server-to-server only: no CORS answer, and a request carrying a browser Origin is refused. Auth is a
// dedicated shared secret (INTAKE_SECRET, at least 32 characters) -- not an admin session, not
// CRON_SECRET; without it every call is refused. JSON only, small bodies, at most RATE_PER_HOUR new
// leads and AI_CALLS_PER_HOUR message reads an hour. A repeated idempotency_key returns the lead it created and creates nothing (checked
// before the AI is called, and again inside intake_create_lead(), migration 0065, which also
// allocates the EV- id and inserts the row in one locked transaction).
//
// What the new row can set off (checked 2026-10-23): on events the database runs events_from_app_doc
// (fills the columns from app_doc), events_set_updated_at, and axis_sync_events (a webhook that posts
// every events insert/update to the separate Axis project -- the same as for any lead the office
// types in). Nothing in the database sends email, makes calendar holds or invoices. In the app, flight
// requests and calendar holds are only ever started by an office click (New Lead save / "flight
// needed" / contract send), never by a gig arriving over sync; client-followups needs a sent contract
// or a booked status and skips needsReview gigs. So the lead is written as status 'lead', needsReview
// true, flightNeeded / groundTransportNeeded false, no contract, no charges.
//
// Deploy with JWT verification OFF (the caller has no Supabase session; the secret is the check).
// Secrets: INTAKE_SECRET, ANTHROPIC_API_KEY.
import { serviceClient } from "../_shared/auth.ts";
import { DEFAULT_EVENT_TYPES, MAX_TEXT, parseLeadText } from "../_shared/leadparse.ts";

const MAX_BODY_BYTES = 16_384;
const RATE_PER_HOUR = 20;      // new leads
const AI_CALLS_PER_HOUR = 40;  // every message read, created or not (a stuck retry loop can't run up AI cost)
const KEY_RE = /^[A-Za-z0-9._:-]{8,200}$/;
const TZ = "America/New_York";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function sameSecret(given: string, expected: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([given, expected].map((s) => crypto.subtle.digest("SHA-256", enc.encode(s))));
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

const localToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const daysFrom = (from: string, to: string) => Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86_400_000);
function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const t = (h * 60 + m + mins) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  if (req.headers.get("Origin")) return json({ ok: false, error: "server-to-server only" }, 403);
  const secret = Deno.env.get("INTAKE_SECRET") || "";
  if (secret.length < 32) return json({ ok: false, error: "intake is not set up" }, 503);
  if (!(await sameSecret(req.headers.get("x-intake-secret") || "", secret))) return json({ ok: false, error: "not authorized" }, 401);
  if (!(req.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) return json({ ok: false, error: "JSON only" }, 415);
  if (Number(req.headers.get("Content-Length") || 0) > MAX_BODY_BYTES) return json({ ok: false, error: "too large" }, 413);

  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return json({ ok: false, error: "too large" }, 413);
  let body: { text?: unknown; idempotency_key?: unknown };
  try { body = JSON.parse(raw); } catch { return json({ ok: false, error: "bad json" }, 400); }
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const key = typeof body?.idempotency_key === "string" ? body.idempotency_key : "";
  if (!KEY_RE.test(key)) return json({ ok: false, error: "idempotency_key must be 8-200 letters, digits or . _ : -" }, 400);
  if (!text) return json({ ok: false, error: "text is empty" }, 400);
  if (text.length > MAX_TEXT) return json({ ok: false, error: `text is too long (max ${MAX_TEXT} characters)` }, 400);

  const sb = serviceClient();
  // Before spending an AI call: a repeat key answers at once, and the hourly limit is checked.
  const { data: seen } = await sb.from("intake_requests").select("legacy_id").eq("idempotency_key", key).maybeSingle();
  if (seen) return json({ ok: true, id: seen.legacy_id, open: "#/needs_review", created: false });
  const { count } = await sb.from("intake_requests").select("idempotency_key", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - 3600_000).toISOString());
  if ((count ?? 0) >= RATE_PER_HOUR) return json({ ok: false, error: "rate limited" }, 429);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ ok: false, error: "AI reading isn't set up (ANTHROPIC_API_KEY missing)" }, 503);
  const { count: reads } = await sb.from("intake_attempts").select("at", { count: "exact", head: true })
    .gte("at", new Date(Date.now() - 3600_000).toISOString());
  if ((reads ?? 0) >= AI_CALLS_PER_HOUR) return json({ ok: false, error: "rate limited" }, 429);
  const { error: attemptErr } = await sb.from("intake_attempts").insert({});
  if (attemptErr) return json({ ok: false, error: "could not record the attempt" }, 500);
  await sb.from("intake_attempts").delete().lt("at", new Date(Date.now() - 86_400_000).toISOString());
  const today = localToday();
  const { data: roster } = await sb.from("artists").select("id, legacy_id, name, commission_pct").order("name");
  const artists = roster || [];
  const parsed = await parseLeadText(apiKey, text, today, DEFAULT_EVENT_TYPES, artists.map((a: { name: string }) => a.name));
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, parsed.status);
  const f = parsed.fields;

  // The same minimum as New Lead's own Save: an artist, a client name and a date.
  const artist = artists.find((a: { name: string }) => a.name === f.artistName);
  const missing = [!artist && "artist", !f.clientName && "client name", !f.date && "date"].filter(Boolean);
  if (missing.length) return json({ ok: false, error: `the message doesn't say the ${missing.join(", ")}; nothing was created` }, 422);
  const artistId = artist.legacy_id || artist.id;
  const type = f.type || DEFAULT_EVENT_TYPES[0];
  const price = Number(f.price) || 0;
  const pct = Number(artist.commission_pct);
  const commission = Math.round(price * ((pct || pct === 0) && !Number.isNaN(pct) ? pct / 100 : 0.15)); // standardCommission()
  // End time like New Lead: start + the artist's included hours for the type (Pricing), 2 hours if unset.
  // No time in the message stays "Time TBD" rather than the form's 19:00 default.
  let endTime: string | null = f.endTime || null;
  if (f.time && !endTime) {
    const { data: pr } = await sb.from("app_records").select("app_doc").eq("collection", "settings").eq("legacy_id", "pricing").maybeSingle();
    const hours = Number(pr?.app_doc?.value?.[artistId]?.[type]?.includedHours) || 2;
    endTime = addMinutes(f.time, Math.round(hours * 60));
  }
  const now = new Date().toISOString();
  // doSubmitLead()'s shape (asp.js), field for field; flagged for review. No id: intake_create_lead adds it.
  const doc = {
    artistId, type, unpaid: false,
    clientName: f.clientName, clientEmail: f.clientEmail, clientPhone: f.clientPhone,
    date: f.date, time: f.time, endTime,
    venue: f.venue, address: "", city: f.city, state: f.state,
    price, commission, status: "lead", depositReceived: false, depositReceivedDate: null,
    balanceReceived: false, balanceReceivedDate: null, reminderIntervalDays: daysFrom(today, f.date) > 30 ? 14 : 7, lastReminderSent: null,
    flightNeeded: false, flightBooked: false, flight: null,
    groundTransportNeeded: false, groundTransportBooked: false, groundTransport: null,
    charges: [], dressCode: "", prepSheets: [], createdAt: today,
    additionalArtists: [], band: null, bandSize: null,
    needsReview: true,
    importNotes: `From chat intake -- review before use.\n\n${text}`,
    log: [
      { ts: now, type: "system", text: `Lead created from chat intake for ${artist.name} -- review before use.` },
      ...(f.notes ? [{ ts: now, type: "system", text: `From the message: ${f.notes}` }] : []),
    ],
  };

  const { data: rows, error } = await sb.rpc("intake_create_lead", { p_key: key, p_doc: doc, p_max_per_hour: RATE_PER_HOUR });
  if (error) {
    if (/intake rate limit/.test(error.message)) return json({ ok: false, error: "rate limited" }, 429);
    console.error("intake-lead: not created", error.message);
    return json({ ok: false, error: "could not create the lead" }, 500);
  }
  const row = Array.isArray(rows) ? rows[0] : rows;
  return json({ ok: true, id: row.legacy_id, open: "#/needs_review", created: !!row.created });
});
