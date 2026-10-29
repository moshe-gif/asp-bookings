// The one way server code sends WhatsApp, from the office number (owner 2026-10-15: "well connect the
// office number" ... "i wanna do coexist" -- the number stays in the WhatsApp Business app on the phone).
// Two ways in, same message format (Meta's Cloud API body):
//  - WHATSAPP_PROVIDER=360dialog (coexistence goes through a Meta partner): WHATSAPP_TOKEN = the 360dialog
//    API key (header D360-API-KEY), POST https://waba-v2.360dialog.io/messages. No phone number id needed.
//  - otherwise Meta directly: WHATSAPP_TOKEN (System User token) + WHATSAPP_PHONE_NUMBER_ID; optional
//    WHATSAPP_GRAPH_VERSION.
//
// TEST MODE (same rule as _shared/mail.ts): unless WHATSAPP_LIVE is exactly "yes", every message goes
// to TEST_WHATSAPP_TO (default the owner's own phone, +1 475-559-5075) instead of its real recipient,
// with the real recipient written into it -- nothing reaches a client or artist until the owner goes live.
//
// A business may only start a conversation with an approved *template*; free text is allowed only
// within 24 hours of the person's last message. So callers send a template (name + body parameters);
// `text` is for replies inside that window and for test-mode notes.

import { serviceClient } from "./auth.ts";

export type WaMessage =
  | { to: string; template: { name: string; lang?: string; params?: string[] }; text?: undefined }
  | { to: string; text: string; template?: undefined };

export function whatsappTestMode(): { on: boolean; to: string } {
  return { on: Deno.env.get("WHATSAPP_LIVE") !== "yes", to: Deno.env.get("TEST_WHATSAPP_TO") || "+14755595075" };
}

// Digits only, US numbers get the leading 1 (Meta wants E.164 without the "+").
export function waNumber(raw: string): string {
  const d = String(raw || "").replace(/\D/g, "");
  return d.length === 10 ? "1" + d : d;
}

// Every send is written to whatsapp_messages (0071), so the owner's WhatsApp tab shows it in the conversation.
export async function sendWhatsApp(msg: WaMessage, sentBy?: string): Promise<{ ok: boolean; error?: string; id?: string; testRedirect?: boolean }> {
  const out = await sendNow(msg);
  try {
    const test = whatsappTestMode(), realTo = waNumber(msg.to);
    const redirected = test.on && realTo !== waNumber(test.to);
    await serviceClient().from("whatsapp_messages").insert({
      wa_id: out.id || null, direction: "out", contact: redirected ? waNumber(test.to) : realTo, real_to: redirected ? realTo : null,
      body: msg.template ? `[${msg.template.name}] ${(msg.template.params || []).join(" · ")}` : msg.text, kind: msg.template ? "template" : "text",
      status: out.ok ? "sent" : "failed", error: out.ok ? null : out.error || null, sent_by: sentBy || null,
    });
  } catch (_) { /* the log never blocks a send */ }
  return out;
}

async function sendNow(msg: WaMessage): Promise<{ ok: boolean; error?: string; id?: string; testRedirect?: boolean }> {
  const token = Deno.env.get("WHATSAPP_TOKEN"), phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const via360 = (Deno.env.get("WHATSAPP_PROVIDER") || "").toLowerCase() === "360dialog";
  if (!token || (!via360 && !phoneId)) return { ok: false, error: "WhatsApp isn't connected yet (WHATSAPP_TOKEN" + (via360 ? "" : " / WHATSAPP_PHONE_NUMBER_ID") + " missing)." };
  const version = Deno.env.get("WHATSAPP_GRAPH_VERSION") || "v23.0";
  const test = whatsappTestMode();
  const realTo = waNumber(msg.to);
  if (!realTo || realTo.length < 8) return { ok: false, error: "invalid WhatsApp number" };
  const redirect = test.on && realTo !== waNumber(test.to);
  const to = redirect ? waNumber(test.to) : realTo;

  const body = msg.template
    ? { messaging_product: "whatsapp", to, type: "template", template: { name: msg.template.name, language: { code: msg.template.lang || "en_US" },
        ...(msg.template.params?.length ? { components: [{ type: "body", parameters: msg.template.params.map((t) => ({ type: "text", text: String(t).slice(0, 1000) })) }] } : {}) } }
    : { messaging_product: "whatsapp", to, type: "text", text: { preview_url: true, body: (redirect ? `[TEST → +${realTo}]\n` : "") + String(msg.text).slice(0, 4000) } };

  let resp: Response;
  try {
    resp = via360
      ? await fetch("https://waba-v2.360dialog.io/messages", { method: "POST", headers: { "D360-API-KEY": token, "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch (err) {
    return { ok: false, error: "could not reach WhatsApp: " + String(err) };
  }
  const out = await resp.json().catch(() => ({}));
  if (!resp.ok) return { ok: false, error: `WhatsApp: ${out?.error?.message || resp.status}` };
  return { ok: true, id: out?.messages?.[0]?.id, testRedirect: redirect };
}

// 360dialog: where incoming messages and delivery statuses are sent (our whatsapp-webhook, with a secret header).
export async function setWebhook360(url: string, secret: string): Promise<{ ok: boolean; error?: string }> {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  if (!token) return { ok: false, error: "WhatsApp isn't connected yet (WHATSAPP_TOKEN missing)." };
  const r = await fetch("https://waba-v2.360dialog.io/v1/configs/webhook", { method: "POST",
    headers: { "D360-API-KEY": token, "Content-Type": "application/json" }, body: JSON.stringify({ url, headers: { "x-asp-webhook": secret } }) });
  const out = await r.json().catch(() => ({}));
  return r.ok ? { ok: true } : { ok: false, error: `360dialog: ${out?.meta?.developer_message || out?.error?.message || r.status}` };
}

// The office's message templates (owner 2026-10-29: "i need you to be able to send messages to new numbers").
// WhatsApp lets a business start a conversation only with a template Meta approved; these are submitted from
// whatsapp-send ("create-templates") and used by name. {{n}} = the params, in order. Meta: utility, en_US, and
// the body may not start or end with a variable.
export const WA_TEMPLATES: Record<string, { text: string; example: string[] }> = {
  deposit_received: { text: "Hi {{1}}, we received your deposit for {{2}} on {{3}}, and your booking is confirmed. If you have any questions, just reply here anytime. Thank you, ASP Management",
    example: ["Sarah", "Benny Friedman", "Sunday, November 22, 2026"] },
  deposit_reminder: { text: "Hi {{1}}, this is a friendly reminder about your booking on {{2}}. Your date is held once the deposit is received. You can review, sign and pay here: {{3}} Thank you, ASP Management",
    example: ["Sarah", "Sunday, November 22, 2026", "https://app.aspmgmt.com/sign/"] },
  balance_reminder: { text: "Hi {{1}}, thank you for booking with ASP Management. This is a reminder that the remaining balance of {{2}} for {{3}} is due before the event. {{4}} Thank you!",
    example: ["Sarah", "$4,500", "Sunday, November 22, 2026", "Pay online: https://app.aspmgmt.com/pay/"] },
  crew_request: { text: "Hi {{1}}, ASP Management would like you to film {{2}} on {{3}} at {{4}}. Please confirm in the app: {{5}} Thank you!",
    example: ["Aharon", "Benny Friedman", "Sun, Nov 2, 7:30 PM", "Lake Terrace, Lakewood", "https://app.aspmgmt.com"] },
};

function fill(text: string, params: string[]): string { return text.replace(/\{\{(\d+)\}\}/g, (_, n) => params[Number(n) - 1] ?? ""); }

// A template message; until Meta approves the template (or if it's rejected) the same words go as plain text,
// which WhatsApp delivers only inside the person's 24-hour reply window.
export async function sendTemplate(to: string, name: string, params: string[], sentBy?: string) {
  const t = WA_TEMPLATES[name];
  const viaTemplate = await sendWhatsApp({ to, template: { name, params } }, sentBy);
  if (viaTemplate.ok || !t) return viaTemplate;
  return await sendWhatsApp({ to, text: fill(t.text, params) }, sentBy);
}

export async function createTemplates360(): Promise<Record<string, string>> {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  if (!token) return { error: "WhatsApp isn't connected yet (WHATSAPP_TOKEN missing)." };
  const out: Record<string, string> = {};
  for (const [name, t] of Object.entries(WA_TEMPLATES)) {
    const r = await fetch("https://waba-v2.360dialog.io/v1/configs/templates", { method: "POST",
      headers: { "D360-API-KEY": token, "Content-Type": "application/json" },
      body: JSON.stringify({ name, category: "UTILITY", language: "en_US", allow_category_change: true,
        components: [{ type: "BODY", text: t.text, example: { body_text: [t.example] } }] }) });
    const j = await r.json().catch(() => ({}));
    out[name] = r.ok ? `submitted (${j?.status || "pending"})` : `refused: ${j?.meta?.developer_message || j?.error?.message || j?.error?.error_user_msg || r.status}`;
  }
  return out;
}

export async function templateStatus360(): Promise<Record<string, string>> {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  if (!token) return {};
  const r = await fetch("https://waba-v2.360dialog.io/v1/configs/templates?limit=100", { headers: { "D360-API-KEY": token } });
  const j = await r.json().catch(() => ({}));
  const out: Record<string, string> = {};
  for (const t of j?.waba_templates || j?.data || []) if (WA_TEMPLATES[t.name]) out[t.name] = String(t.status || "").toLowerCase();
  return out;
}

// An incoming photo / voice note / video / document, by its WhatsApp media id (360dialog: look up the file's
// URL, swap Meta's host for 360dialog's, download with the key).
export async function fetchMedia360(mediaId: string): Promise<{ ok: true; bytes: ArrayBuffer; mime: string } | { ok: false; error: string }> {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  if (!token) return { ok: false, error: "WhatsApp isn't connected" };
  const meta = await fetch(`https://waba-v2.360dialog.io/${encodeURIComponent(mediaId)}`, { headers: { "D360-API-KEY": token } });
  const j = await meta.json().catch(() => ({}));
  if (!meta.ok || !j?.url) return { ok: false, error: `WhatsApp no longer has this file (${j?.error?.message || meta.status})` };
  const u = new URL(String(j.url).replace(/\\/g, ""));
  if (u.hostname !== "lookaside.fbsbx.com") return { ok: false, error: "unexpected media host" };
  const file = await fetch(`https://waba-v2.360dialog.io${u.pathname}${u.search}`, { headers: { "D360-API-KEY": token } });
  if (!file.ok) return { ok: false, error: `download failed (${file.status})` };
  return { ok: true, bytes: await file.arrayBuffer(), mime: j.mime_type || file.headers.get("content-type") || "application/octet-stream" };
}
