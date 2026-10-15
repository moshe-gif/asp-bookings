// Admin-only WhatsApp send (test page, and the app's "WhatsApp the client/artist" actions). Goes through
// _shared/whatsapp.ts, so test mode applies: until WHATSAPP_LIVE=yes everything lands on the owner's phone.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { sendWhatsApp, whatsappTestMode } from "../_shared/whatsapp.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;
  // deno-lint-ignore no-explicit-any
  const b = await readJson<any>(req);
  if (!b?.to) return json({ ok: false, error: "missing recipient" }, 400);
  const sent = b.template?.name
    ? await sendWhatsApp({ to: b.to, template: { name: String(b.template.name), lang: b.template.lang, params: Array.isArray(b.template.params) ? b.template.params.map(String) : [] } })
    : typeof b.text === "string" && b.text.trim() ? await sendWhatsApp({ to: b.to, text: b.text })
    : null;
  if (!sent) return json({ ok: false, error: "send a template or text" }, 400);
  return json({ ...sent, testMode: whatsappTestMode().on }, sent.ok ? 200 : 502);
});
