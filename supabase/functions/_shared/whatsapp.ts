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
import { appUrl } from "./config.ts";

export type WaMessage =
  | { to: string; template: { name: string; lang?: string; params?: string[]; headerImage?: string; button?: string }; text?: undefined }
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

// deno-lint-ignore no-explicit-any
function templateComponents(t: { params?: string[]; headerImage?: string; button?: string }): any[] {
  return [
    ...(t.headerImage ? [{ type: "header", parameters: [{ type: "image", image: { link: t.headerImage } }] }] : []),
    ...(t.params?.length ? [{ type: "body", parameters: t.params.map((x) => ({ type: "text", text: String(x).slice(0, 1000) })) }] : []),
    ...(t.button ? [{ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: t.button }] }] : []),
  ];
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
        ...(templateComponents(msg.template).length ? { components: templateComponents(msg.template) } : {}) } }
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

// The branded versions (owner 2026-11-01: "i want it to look like the emails ... a little more messagy then
// emaily"): the ASP logo on top (as in the emails), a short chatty text, "ASP Management" underneath and a tap
// button where the email has one. The button opens <base>?t=<token>; sign/ and pay/ move it back into the #.
// Each one is built from the plain template's params, so callers don't change, and until Meta approves a
// branded one the plain approved template goes instead (then plain text).
type Branded = { text: string; example: string[]; button?: { text: string; url: string; example?: string };
  from: (p: string[]) => { params: string[]; button?: string } | null };
const linkToken = (url: string, path: string) => {
  const pre = `${appUrl()}${path}#`;
  return url && url.startsWith(pre) ? url.slice(pre.length) : "";
};
export const WA_BRANDED: Record<string, Branded> = {
  asp_deposit_received: { text: "Hi {{1}}! 🎉\n\nWe got your deposit, so you're all booked: *{{2}}* on *{{3}}*.\n\nIf anything comes up, just reply here. We're looking forward to it!",
    example: ["Sarah", "Benny Friedman", "Sunday, November 22, 2026"], from: (p) => ({ params: p.slice(0, 3) }) },
  asp_deposit_reminder: { text: "Hi {{1}}, just a quick reminder about your booking on *{{2}}*.\n\nThe date is held once the deposit comes in. You can review, sign and pay right from your phone with the button below.\n\nAny questions? Just reply here.",
    example: ["Sarah", "Sunday, November 22, 2026"], button: { text: "Review & pay deposit", url: "/sign/?t={{1}}", example: "sample" },
    from: (p) => { const t = linkToken(p[2], "/sign/"); return t ? { params: [p[0], p[1]], button: t } : null; } },
  asp_balance_reminder: { text: "Hi {{1}}, thanks again for booking with us!\n\nJust a reminder that the balance of *{{2}}* for *{{3}}* is due before the event. You can pay it online with the button below.\n\nAny questions? Just reply here.",
    example: ["Sarah", "$4,500", "Sunday, November 22, 2026"], button: { text: "Pay balance", url: "/pay/?t={{1}}", example: "sample" },
    from: (p) => { const t = linkToken(String(p[3] || "").replace(/^Pay online: /, ""), "/pay/"); return t ? { params: p.slice(0, 3), button: t } : null; } },
  asp_balance_reminder_nolink: { text: "Hi {{1}}, thanks again for booking with us!\n\nJust a reminder that the balance of *{{2}}* for *{{3}}* is due before the event. Reply here anytime and we'll help with payment.\n\nThank you!",
    example: ["Sarah", "$4,500", "Sunday, November 22, 2026"],
    from: (p) => linkToken(String(p[3] || "").replace(/^Pay online: /, ""), "/pay/") ? null : { params: p.slice(0, 3) } },
  asp_crew_request: { text: "Hi {{1}}! 🎥 Can you film *{{2}}* on *{{3}}* at {{4}}?\n\nTap below to confirm in the app. Thanks!",
    example: ["Aharon", "Benny Friedman", "Sun, Nov 2, 7:30 PM", "Lake Terrace, Lakewood"], button: { text: "Confirm in the app", url: "/" },
    from: (p) => ({ params: p.slice(0, 4) }) },
};
const BRANDED_FOR: Record<string, string[]> = { deposit_received: ["asp_deposit_received"], deposit_reminder: ["asp_deposit_reminder"],
  balance_reminder: ["asp_balance_reminder", "asp_balance_reminder_nolink"], crew_request: ["asp_crew_request"] };
export const waLogoUrl = () => `${appUrl()}/assets/brand/asp-whatsapp-header.jpg`;

// A template message: the branded one if Meta approved it, else the plain approved one, else the same words as
// plain text (which WhatsApp delivers only inside the person's 24-hour reply window).
export async function sendTemplate(to: string, name: string, params: string[], sentBy?: string) {
  const t = WA_TEMPLATES[name];
  const approved = await templateStatus360().catch(() => ({} as Record<string, string>));
  for (const b of BRANDED_FOR[name] || []) {
    const spec = WA_BRANDED[b], built = spec.from(params);
    if (!built || approved[b] !== "approved") continue;
    const sent = await sendWhatsApp({ to, template: { name: b, params: built.params, headerImage: waLogoUrl(), button: built.button } }, sentBy);
    if (sent.ok) return sent;
  }
  const viaTemplate = await sendWhatsApp({ to, template: { name, params } }, sentBy);
  if (viaTemplate.ok || !t) return viaTemplate;
  return await sendWhatsApp({ to, text: fill(t.text, params) }, sentBy);
}

export async function createTemplates360(): Promise<Record<string, string>> {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  if (!token) return { error: "WhatsApp isn't connected yet (WHATSAPP_TOKEN missing)." };
  const out: Record<string, string> = {};
  const have = await templateStatus360();
  const all: [string, Branded | { text: string; example: string[]; button?: undefined }, boolean][] = [
    ...Object.entries(WA_TEMPLATES).map(([n, t]) => [n, t, false] as [string, typeof t, boolean]),
    ...Object.entries(WA_BRANDED).map(([n, t]) => [n, t, true] as [string, Branded, boolean])];
  for (const [name, t, branded] of all) {
    if (have[name]) { out[name] = `already there (${have[name]})`; continue; }
    const b = t.button;
    const components = [
      ...(branded ? [{ type: "HEADER", format: "IMAGE", example: { header_handle: [waLogoUrl()] } }] : []),
      { type: "BODY", text: t.text, example: { body_text: [t.example] } },
      ...(branded ? [{ type: "FOOTER", text: "ASP Management" }] : []),
      ...(b ? [{ type: "BUTTONS", buttons: [{ type: "URL", text: b.text, url: appUrl() + b.url, ...(b.example ? { example: [b.example] } : {}) }] }] : []),
    ];
    const r = await fetch("https://waba-v2.360dialog.io/v1/configs/templates", { method: "POST",
      headers: { "D360-API-KEY": token, "Content-Type": "application/json" },
      body: JSON.stringify({ name, category: "UTILITY", language: "en_US", allow_category_change: true, components }) });
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
  for (const t of j?.waba_templates || j?.data || []) if (WA_TEMPLATES[t.name] || WA_BRANDED[t.name]) out[t.name] = String(t.status || "").toLowerCase();
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
