// Videographer assignments (migration 0069; owner 2026-10-28: "assign lilker and he'll get a whatsapp
// letting him know we want him for the date and then he should be able to confirm").
//   assign   {eventId, crewId}   admins and social crew: ask a videographer to film a gig, WhatsApp him
//   unassign {eventId, crewId}   admins and social crew: take the request back
//   respond  {eventId, accept}   the videographer himself: confirm or turn it down
// eventId is the gig's legacy id ("EV-…") or its uuid. Nobody here can create, change or cancel a gig.
// WhatsApp goes through _shared/whatsapp.ts, so test mode applies (the owner's phone until WHATSAPP_LIVE).
// A business may only open a WhatsApp conversation with an approved template: set WHATSAPP_CREW_TEMPLATE
// to its name (body {{1}} first name, {{2}} singers, {{3}} when, {{4}} where, {{5}} app link); without
// it the message goes as plain text, which WhatsApp delivers only inside a 24-hour reply window.
import { createClient } from "../_shared/deps.ts";
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { serviceClient } from "../_shared/auth.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";
import { appUrl } from "../_shared/config.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
  });
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return json({ ok: false, error: "not authenticated" }, 401);
  const sb = serviceClient();
  const [{ data: admin }, { data: me }] = await Promise.all([
    sb.from("admin_users").select("id, name").eq("user_id", user.id).maybeSingle(),
    sb.from("crew_members").select("id, name, kind").eq("user_id", user.id).eq("active", true).maybeSingle(),
  ]);
  const canAssign = !!admin || me?.kind === "social";

  // deno-lint-ignore no-explicit-any
  const b = await readJson<any>(req);
  const action = String(b?.action || "");
  const ref = String(b?.eventId || "");
  if (!ref) return json({ ok: false, error: "missing eventId" }, 400);
  const { data: ev } = await sb.from("events").select("id, legacy_id, date, time, venue, city, state, status, unpaid, artist_id, app_doc")
    .eq(UUID.test(ref) ? "id" : "legacy_id", ref).maybeSingle();
  if (!ev) return json({ ok: false, error: "gig not found" }, 404);

  if (action === "assign" || action === "unassign") {
    if (!canAssign) return json({ ok: false, error: "not authorized" }, 403);
    const crewId = String(b?.crewId || "");
    const { data: crew } = UUID.test(crewId)
      ? await sb.from("crew_members").select("id, name, phone, kind, active").eq("id", crewId).maybeSingle()
      : { data: null };
    if (!crew || crew.kind !== "videographer") return json({ ok: false, error: "videographer not found" }, 404);

    if (action === "unassign") {
      const { error } = await sb.from("gig_crew").delete().eq("event_id", ev.id).eq("crew_id", crew.id);
      return error ? json({ ok: false, error: error.message }, 500) : json({ ok: true });
    }
    if (!crew.active) return json({ ok: false, error: `${crew.name} is not active` }, 400);
    if (ev.unpaid || !["contract_sent", "booked", "paid"].includes(ev.status)) return json({ ok: false, error: "Only a booked gig can get a videographer." }, 400);
    // Asked already and still waiting (asked in the last 10 minutes): no second WhatsApp.
    const { data: prior } = await sb.from("gig_crew").select("status, requested_at").eq("event_id", ev.id).eq("crew_id", crew.id).maybeSingle();
    if (prior?.status === "requested" && Date.now() - new Date(prior.requested_at).getTime() < 10 * 60 * 1000) return json({ ok: true, whatsapp: { ok: false, error: "already asked a few minutes ago" } });
    const { error } = await sb.from("gig_crew").upsert({ event_id: ev.id, crew_id: crew.id, status: "requested", requested_by: user.id,
      requested_at: new Date().toISOString(), responded_at: null, notify_result: null }, { onConflict: "event_id,crew_id" });
    if (error) return json({ ok: false, error: error.message }, 500);

    let whatsapp: { ok: boolean; error?: string; testRedirect?: boolean } = { ok: false, error: `No phone number for ${crew.name} yet.` };
    if (crew.phone) {
      const { singers, when, where } = await describe(sb, ev);
      const first = String(crew.name).split(/\s+/)[0];
      const tpl = Deno.env.get("WHATSAPP_CREW_TEMPLATE");
      whatsapp = tpl
        ? await sendWhatsApp({ to: crew.phone, template: { name: tpl, params: [first, singers, when, where, appUrl()] } })
        : await sendWhatsApp({ to: crew.phone, text: `Hi ${first}, ASP Management would like you to film ${singers} on ${when}${where ? ` at ${where}` : ""}. Please confirm in the app: ${appUrl()}` });
    }
    await sb.from("gig_crew").update({ notify_result: whatsapp.ok ? (whatsapp.testRedirect ? "whatsapp (test)" : "whatsapp") : `not sent: ${whatsapp.error}` })
      .eq("event_id", ev.id).eq("crew_id", crew.id);
    return json({ ok: true, whatsapp });
  }

  if (action === "respond") {
    if (!me || me.kind !== "videographer") return json({ ok: false, error: "not authorized" }, 403);
    const { data, error } = await sb.from("gig_crew").update({ status: b?.accept ? "confirmed" : "declined", responded_at: new Date().toISOString() })
      .eq("event_id", ev.id).eq("crew_id", me.id).select("status").maybeSingle();
    if (error) return json({ ok: false, error: error.message }, 500);
    if (!data) return json({ ok: false, error: "You weren't asked for this gig." }, 404);
    return json({ ok: true, status: data.status });
  }

  return json({ ok: false, error: "unknown action" }, 400);
});

// "Benny Friedman & Eli Marcus", "Sun, Nov 2, 7:30 PM", "Venue, City"
// deno-lint-ignore no-explicit-any
async function describe(sb: any, ev: any): Promise<{ singers: string; when: string; where: string }> {
  const extra = Array.isArray(ev.app_doc?.additionalArtists) ? ev.app_doc.additionalArtists.map((x: { artistId?: string }) => String(x?.artistId || "")) : [];
  const { data: artists } = await sb.from("artists").select("id, legacy_id, name");
  // deno-lint-ignore no-explicit-any
  const byRef = (r: string) => (artists || []).find((a: any) => a.id === r || a.legacy_id === r);
  const names = [ev.artist_id, ...extra].map((r) => r && byRef(r)?.name).filter(Boolean);
  const day = new Date(`${ev.date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  let time = "";
  if (ev.time && ev.time !== "00:00") {
    const [h, m] = String(ev.time).split(":").map(Number);
    time = `, ${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  }
  return { singers: names.join(" & ") || "a gig", when: day + time, where: [ev.venue, ev.city].filter(Boolean).join(", ") };
}
