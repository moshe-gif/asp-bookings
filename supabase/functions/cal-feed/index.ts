// A singer's own gigs calendar, kept up to date by itself (migration 0088; owner 2026-11-10: "it should auto
// update his calendar"). Two ways in:
//   GET  ?t=<token>            public: the .ics feed Google / Apple Calendar re-read on their own. The token is
//                              the only key; the feed has dates, times, places and the gig link -- never money.
//   POST {action:"link"}       the signed-in singer: their feed link (made the first time).
//   POST {action:"reset"}      the signed-in singer: a new link (the old one stops working).
// Deploy with JWT verification OFF (calendar apps can't sign in); POST checks the caller itself.
import { createClient } from "../_shared/deps.ts";
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { serviceClient } from "../_shared/auth.ts";
import { appUrl } from "../_shared/config.ts";

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const TZ = "America/New_York";

function newToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function feedUrl(token: string): string {
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/cal-feed?t=${token}`;
}
// iCalendar text: escape, then fold lines at 75 octets.
const icsText = (s: unknown) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
function fold(line: string): string {
  const out: string[] = []; let cur = "";
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > 74) { out.push(cur); cur = " " + ch; } else cur += ch;
  }
  out.push(cur); return out.join("\r\n");
}
const ymd = (d: string) => d.slice(0, 10).replace(/-/g, "");
const hm = (t: string) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ""); return m ? [Number(m[1]), Number(m[2])] : null; };
function addDays(d: string, n: number): string { const x = new Date(d.slice(0, 10) + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
const pad = (n: number) => String(n).padStart(2, "0");

// deno-lint-ignore no-explicit-any
async function artistFor(req: Request): Promise<any | null> {
  const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
  });
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return null;
  const { data } = await serviceClient().from("artists").select("id, name").eq("user_id", user.id).maybeSingle();
  return data || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const sb = serviceClient();

  if (req.method === "GET") {
    const t = new URL(req.url).searchParams.get("t") || "";
    if (!TOKEN_RE.test(t)) return new Response("not found", { status: 404 });
    const { data: feed } = await sb.from("calendar_feeds").select("artist_id").eq("token", t).maybeSingle();
    if (!feed) return new Response("not found", { status: 404 });
    await sb.from("calendar_feeds").update({ last_read_at: new Date().toISOString() }).eq("artist_id", feed.artist_id);
    const { data: artist } = await sb.from("artists").select("id, legacy_id, name").eq("id", feed.artist_id).maybeSingle();
    if (!artist) return new Response("not found", { status: 404 });
    // Their gigs: the main singer, or listed with others on the gig. Holds (contract sent) are marked HOLD.
    const since = addDays(new Date().toISOString(), -60);
    const { data: rows } = await sb.from("events").select("id, legacy_id, artist_id, status, unpaid, type, date, time, end_time, venue, city, state, client_name, dress_code, app_doc")
      .gte("date", since).in("status", ["contract_sent", "booked", "paid"]).order("date").limit(2000);
    const mine = (rows || []).filter((e) => !e.unpaid && (e.artist_id === artist.id ||
      (Array.isArray(e.app_doc?.additionalArtists) && e.app_doc.additionalArtists.some((x: { artistId?: string }) => x && (x.artistId === artist.legacy_id || x.artistId === artist.id)))));
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ASP Management//Gigs//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      `X-WR-CALNAME:${icsText(`${artist.name} — ASP gigs`)}`, `X-WR-TIMEZONE:${TZ}`, "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"];
    for (const e of mine) {
      if (!e.date) continue;
      const doc = e.app_doc || {};
      const start = hm(e.time); const end = hm(e.end_time);
      const hold = e.status === "contract_sent";
      const place = [e.venue, doc.address, e.city, e.state].filter(Boolean).join(", ");
      const link = `${appUrl()}/#/event/${encodeURIComponent(e.legacy_id || e.id)}`;
      lines.push("BEGIN:VEVENT", `UID:${e.id}@aspmgmt.com`, `DTSTAMP:${stamp}`);
      if (start && !(start[0] === 0 && start[1] === 0)) {
        const s = `${ymd(e.date)}T${pad(start[0])}${pad(start[1])}00`;
        let endDate = e.date, eh = end ? end[0] : start[0] + 4, em = end ? end[1] : start[1];
        if (eh >= 24 || (end && (eh * 60 + em) <= (start[0] * 60 + start[1]))) { endDate = addDays(e.date, 1); eh = eh % 24; }
        lines.push(`DTSTART;TZID=${TZ}:${s}`, `DTEND;TZID=${TZ}:${ymd(endDate)}T${pad(eh)}${pad(em)}00`);
      } else {
        lines.push(`DTSTART;VALUE=DATE:${ymd(e.date)}`, `DTEND;VALUE=DATE:${ymd(addDays(e.date, 1))}`);
      }
      lines.push(fold(`SUMMARY:${icsText(`${hold ? "HOLD · " : ""}${e.type || "Gig"}${e.venue ? " · " + e.venue : ""}`)}`));
      if (place) lines.push(fold(`LOCATION:${icsText(place)}`));
      lines.push(fold(`DESCRIPTION:${icsText(`${hold ? "On hold — not confirmed yet.\n" : ""}${e.type || "Gig"}${e.client_name ? ` for ${e.client_name}` : ""}.${e.dress_code ? `\nDress code: ${e.dress_code}` : ""}\nGig sheet, directions and contacts: ${link}`)}`));
      lines.push(fold(`URL:${link}`), `STATUS:${hold ? "TENTATIVE" : "CONFIRMED"}`, "END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    return new Response(lines.join("\r\n") + "\r\n", { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" } });
  }

  const json = jsonFor(req);
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  const body = await readJson<{ action?: string }>(req);
  const artist = await artistFor(req);
  if (!artist) return json({ ok: false, error: "not a singer login" }, 403);
  if (body?.action === "reset") await sb.from("calendar_feeds").delete().eq("artist_id", artist.id);
  else if (body?.action !== "link") return json({ ok: false, error: "unknown action" }, 400);
  const { data: have } = await sb.from("calendar_feeds").select("token").eq("artist_id", artist.id).maybeSingle();
  let token = have?.token;
  if (!token) {
    token = newToken();
    const { error } = await sb.from("calendar_feeds").insert({ artist_id: artist.id, token });
    if (error) return json({ ok: false, error: "server" }, 500);
  }
  const url = feedUrl(token);
  return json({ ok: true, url, webcal: url.replace(/^https:/, "webcal:"),
    google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(url.replace(/^https:/, "webcal:"))}` });
});
