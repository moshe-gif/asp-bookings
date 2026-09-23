// Looks up a flight's current status via FlightAware's AeroAPI (ops automation spec item 8:
// "automatic branded on-time/delay/cancel/gate/terminal/schedule-change updates"). Called on
// demand from a flight segment's "Check Status" button for now -- a webhook or scheduled poll
// (starting near departure, stopping after arrival/cancel, per the spec) is real additional scope
// on top of this single-lookup adapter, not built this pass.
//
// Behind a provider adapter shape (ident/date in, a small normalized status object out) so a
// different provider could be swapped in later without changing the call site.
//
// Function Secret needed: FLIGHTAWARE_API_KEY. Never exposed to the client -- if it's unset, this
// returns a clear "not configured" error rather than a confusing upstream failure.
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return json({ ok: false, error: "not authenticated" }, 401);
  const { data: isAdmin, error: adminErr } = await supabase.rpc("is_admin");
  if (adminErr || !isAdmin) return json({ ok: false, error: "not authorized" }, 403);

  const apiKey = Deno.env.get("FLIGHTAWARE_API_KEY");
  if (!apiKey) return json({ ok: false, error: "FlightAware isn't connected yet -- see ops/FLIGHTAWARE_SETUP.md" }, 501);

  let body: { ident?: string; date?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "bad json" }, 400);
  }
  const ident = (body.ident || "").trim();
  if (!ident) return json({ ok: false, error: "missing flight ident (e.g. AA123)" }, 400);

  const resp = await fetch(`https://aeroapi.flightaware.com/aeroapi/flights/${encodeURIComponent(ident)}`, {
    headers: { "x-apikey": apiKey },
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok || !data) {
    return json({ ok: false, error: `FlightAware lookup failed (${resp.status})` }, 502);
  }

  const flight = data.flights?.[0];
  if (!flight) return json({ ok: false, error: `No current flight found for ${ident}` }, 404);

  // Normalized shape -- what the app actually needs to show/log, not the full AeroAPI payload.
  return json({
    ok: true,
    status: flight.status || null,
    cancelled: !!flight.cancelled,
    departureGate: flight.gate_origin || null,
    arrivalGate: flight.gate_destination || null,
    departureTerminal: flight.terminal_origin || null,
    arrivalTerminal: flight.terminal_destination || null,
    scheduledOut: flight.scheduled_out || null,
    estimatedOut: flight.estimated_out || null,
    actualOut: flight.actual_out || null,
    scheduledIn: flight.scheduled_in || null,
    estimatedIn: flight.estimated_in || null,
    actualIn: flight.actual_in || null,
  });
});
