// Welcome email for a new office user or artist (owner 2026-10-15: "send them both welcome emails to the
// portal"). Admin-only. Only for someone already added (Settings -> Users), so the sign-in actually works.
// Goes through _shared/mail.ts, so test mode applies (staff on TEST_EMAIL_ALLOW get it; anyone else's
// welcome lands at the test address).
// Also makes the person's sign-in account when there isn't one yet (sign-in codes only go to existing
// accounts), so adding someone in the app and sending the welcome is all it takes (2026-10-28, crew).
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";
import { sendRelayEmail } from "../_shared/mail.ts";
import { appUrl, brandLogoHtml } from "../_shared/config.ts";

const ROLE_LINES: Record<string, string> = {
  admin_bookings: "You'll handle bookings: leads, contracts, travel requests and gig sheets.",
  admin_bookkeeping: "You'll see the money side: deposits, balances and payouts.",
  admin_ceo: "You'll have the full picture: every booking, contract and the numbers.",
  admin_coo: "You'll run the day-to-day across bookings, contracts and travel.",
};
const CREW_LINES: Record<string, string> = {
  social: "You'll see the calendar and every gig's details, assign the videographer, and manage the video library.",
  videographer: "You'll see the gigs we'd like you to film (confirm them right in the app), with the time, place and directions, and the video library.",
};
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;
  // deno-lint-ignore no-explicit-any
  const body = await readJson<any>(req);
  const email = String(body?.email || "").trim().toLowerCase();
  if (!email) return json({ ok: false, error: "missing email" }, 400);

  const sb = serviceClient();
  const { data: admin } = await sb.from("admin_users").select("name, role, user_id").ilike("email", email).maybeSingle();
  const { data: artist } = admin ? { data: null } : await sb.from("artists").select("name, user_id").ilike("email", email).maybeSingle();
  const { data: crew } = admin || artist ? { data: null } : await sb.from("crew_members").select("id, name, kind, user_id").eq("email", email).maybeSingle();
  const person = admin || artist || crew;
  if (!person) return json({ ok: false, error: "Add this person in Settings → Users first, then send the welcome." }, 404);

  if (!person.user_id) {
    // No sign-in account yet: make one (confirmed, no password -- they sign in with an emailed code or
    // a passkey). The roster-link trigger connects it to their row.
    const { error } = await sb.auth.admin.createUser({ email, email_confirm: true });
    if (error && !/already/i.test(error.message)) return json({ ok: false, error: "Could not create the sign-in: " + error.message }, 500);
  }
  const first = String(person.name || "").split(/\s+/)[0] || "there";
  const what = admin ? (ROLE_LINES[admin.role] || "You'll have access to the office side of the app.")
    : crew ? (CREW_LINES[crew.kind] || "You'll see the gigs and the video library.")
    : "You'll see your gigs, itineraries, gig sheets and your money.";
  const url = appUrl();
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#F5F4EF;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17171A;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;">
    <div style="padding:22px 24px 14px;border-bottom:1px solid #E3E3E8;">${brandLogoHtml(180)}</div>
    <div style="padding:24px;font-size:14px;line-height:1.6;">
      <p style="margin:0 0 12px;font-size:18px;font-weight:700;">Welcome to ASP Bookings, ${esc(first)}!</p>
      <p style="margin:0 0 12px;">You now have an account in the ASP Management booking app. ${esc(what)}</p>
      <p style="margin:0 0 6px;font-weight:700;">How to sign in</p>
      <ol style="margin:0 0 14px;padding-left:20px;">
        <li>Open <a href="${url}" style="color:#4C6FA5;">${url.replace(/^https?:\/\//, "")}</a></li>
        <li>Enter this email address: <strong>${esc(email)}</strong></li>
        <li>We email you a short code. Type it in and you're in. No password needed.</li>
      </ol>
      <p style="margin:18px 0;"><a href="${url}" style="display:inline-block;background:#4C6FA5;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;">Open ASP Bookings</a></p>
      <p style="margin:0 0 12px;color:#67676D;font-size:13px;">Tip: on your phone, open it in Safari or Chrome and choose <em>Add to Home Screen</em>, so it works like an app.</p>
      <p style="margin:18px 0 0;">Welcome aboard,<br/>ASP Management</p>
    </div>
  </div></body></html>`;
  const sent = await sendRelayEmail(sb, { to: email, subject: "Welcome to ASP Bookings", html, brand: "asp" });
  return json(sent.ok ? { ok: true } : { ok: false, error: sent.error }, sent.ok ? 200 : 502);
});
