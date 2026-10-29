// Admin-only WhatsApp send (test page, and the app's "WhatsApp the client/artist" actions). Goes through
// _shared/whatsapp.ts, so test mode applies: until WHATSAPP_LIVE=yes everything lands on the owner's phone.
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { createTemplates360, sendWhatsApp, setWebhook360, templateStatus360, whatsappTestMode } from "../_shared/whatsapp.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const auth = await requireAdmin(req, json);
  if (auth instanceof Response) return auth;
  // deno-lint-ignore no-explicit-any
  const b = await readJson<any>(req);
  // The owner's WhatsApp tab (0071): point 360dialog's incoming messages at whatsapp-webhook.
  if (b?.action === "setup-webhook" || b?.action === "status" || b?.action === "create-templates") {
    const { data: allowed } = await auth.caller.rpc("can_use_whatsapp");
    if (!allowed) return json({ ok: false, error: "not authorized" }, 403);
    const t = whatsappTestMode();
    if (b.action === "status") return json({ ok: true, connected: !!Deno.env.get("WHATSAPP_TOKEN"), incoming: !!Deno.env.get("WHATSAPP_WEBHOOK_SECRET"), testMode: t.on, testTo: t.to, templates: await templateStatus360() });
    if (b.action === "create-templates") return json({ ok: true, templates: await createTemplates360() });
    const secret = Deno.env.get("WHATSAPP_WEBHOOK_SECRET");
    if (!secret) return json({ ok: false, error: "WHATSAPP_WEBHOOK_SECRET is not set" }, 500);
    const r = await setWebhook360(`${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-webhook`, secret);
    return json(r, r.ok ? 200 : 502);
  }
  if (!b?.to) return json({ ok: false, error: "missing recipient" }, 400);
  const sent = b.template?.name
    ? await sendWhatsApp({ to: b.to, template: { name: String(b.template.name), lang: b.template.lang, params: Array.isArray(b.template.params) ? b.template.params.map(String) : [] } }, auth.user.id)
    : typeof b.text === "string" && b.text.trim() ? await sendWhatsApp({ to: b.to, text: b.text }, auth.user.id)
    : null;
  if (!sent) return json({ ok: false, error: "send a template or text" }, 400);
  return json({ ...sent, testMode: whatsappTestMode().on }, sent.ok ? 200 : 502);
});
