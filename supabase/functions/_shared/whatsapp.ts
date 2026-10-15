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

export async function sendWhatsApp(msg: WaMessage): Promise<{ ok: boolean; error?: string; id?: string; testRedirect?: boolean }> {
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
