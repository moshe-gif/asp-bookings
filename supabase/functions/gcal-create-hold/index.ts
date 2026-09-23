// Creates or updates a HOLD/CONFIRMED calendar event on ASP's main calendar and/or one or more
// artists' calendars (ops automation spec item 4). Idempotent by design: calendar_links (one row
// per event x calendar-role x artist) stores the real Google calendar id + event id from the
// first write, and every later call for the same (event, target) PATCHes that exact event by ID
// -- never searches by title, per the spec's explicit requirement.
//
// Targets that don't have a calendar_id mapped yet (integration_connections, type=
// 'google_calendar') are reported as skipped, not silently ignored or treated as errors -- an
// admin needs to add that mapping in Settings, this function can't invent one.
//
// UNVERIFIED beyond "this is what the Calendar API v3 documents expect" -- no real Google account
// was available in this environment to exercise it end to end. Function Secrets needed:
// GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET (to refresh the stored access token).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}

function serviceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

async function getValidAccessToken(): Promise<string> {
  const sb = serviceClient();
  const { data: row, error } = await sb.from("gcal_connection").select("*").eq("id", 1).maybeSingle();
  if (error || !row) throw new Error("Google Calendar is not connected.");

  const msLeft = new Date(row.access_token_expires_at).getTime() - Date.now();
  if (msLeft > 60_000) return row.access_token;

  const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!;
  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId, client_secret: clientSecret,
      refresh_token: row.refresh_token, grant_type: "refresh_token",
    }),
  });
  if (!resp.ok) throw new Error("Could not refresh the Google Calendar connection -- it may need to be reconnected in Settings.");
  const tokens = await resp.json();
  await sb.from("gcal_connection").update({
    access_token: tokens.access_token,
    access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  return tokens.access_token;
}

type Target = { role: "asp_main" | "artist"; artistId: string | null; label: string };

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);

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

  let body: {
    eventId?: string; summary?: string; description?: string;
    startISO?: string; endISO?: string; timezone?: string;
    status?: "hold" | "confirmed"; artistIds?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "bad json" }, 400);
  }
  const { eventId, summary, description, startISO, endISO, timezone, artistIds } = body;
  const calStatus = body.status === "confirmed" ? "confirmed" : "hold";
  if (!eventId || !summary || !startISO || !endISO) {
    return json({ ok: false, error: "missing required fields (eventId, summary, startISO, endISO)" }, 400);
  }

  const sb = serviceClient();
  const targets: Target[] = [
    { role: "asp_main", artistId: null, label: "ASP Main Calendar" },
    ...(artistIds || []).map((id) => ({ role: "artist" as const, artistId: id, label: id })),
  ];

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken();
  } catch (err) {
    return json({ ok: false, error: String((err as Error).message || err) }, 502);
  }

  const results = [];
  const titlePrefix = calStatus === "confirmed" ? "STATUS: CONFIRMED" : "HOLD";
  const eventBody = {
    summary: `${titlePrefix} - ${summary}`,
    description: description || "",
    start: { dateTime: startISO, timeZone: timezone || "America/New_York" },
    end: { dateTime: endISO, timeZone: timezone || "America/New_York" },
  };

  for (const target of targets) {
    try {
      // .is() for null (ASP main has no artist_id), .eq() for a real artist id -- .eq('col', null)
      // does not mean IS NULL in PostgREST/supabase-js, so these can't share one call.
      let connQuery = sb.from("integration_connections").select("config").eq("type", "google_calendar");
      connQuery = target.artistId ? connQuery.eq("artist_id", target.artistId) : connQuery.is("artist_id", null);
      const { data: conn } = await connQuery.maybeSingle();
      const calendarId = conn?.config?.calendar_id;
      if (!calendarId) {
        results.push({ target: target.label, status: "skipped_not_mapped", detail: `No Google Calendar ID mapped for ${target.label} yet (Settings -> Google Calendar Sync).` });
        continue;
      }

      let linkQuery = sb.from("calendar_links").select("*").eq("event_id", eventId).eq("calendar_role", target.role);
      linkQuery = target.artistId ? linkQuery.eq("artist_id", target.artistId) : linkQuery.is("artist_id", null);
      const { data: existingLink } = await linkQuery.maybeSingle();

      const apiBase = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
      let resp: Response;
      if (existingLink) {
        resp = await fetch(`${apiBase}/${existingLink.google_event_id}`, {
          method: "PATCH",
          headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(eventBody),
        });
      } else {
        resp = await fetch(apiBase, {
          method: "POST",
          headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(eventBody),
        });
      }
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data) {
        results.push({ target: target.label, status: "error", detail: data?.error?.message || `Calendar API error (${resp.status})` });
        continue;
      }

      if (existingLink) {
        await sb.from("calendar_links").update({ calendar_status: calStatus, last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", existingLink.id);
        results.push({ target: target.label, status: "updated", detail: calStatus });
      } else {
        await sb.from("calendar_links").insert({
          event_id: eventId, calendar_role: target.role, artist_id: target.artistId,
          google_calendar_id: calendarId, google_event_id: data.id,
          calendar_status: calStatus, last_synced_at: new Date().toISOString(),
        });
        results.push({ target: target.label, status: "created", detail: calStatus });
      }
    } catch (err) {
      results.push({ target: target.label, status: "error", detail: String((err as Error).message || err) });
    }
  }

  return json({ ok: true, results });
});
