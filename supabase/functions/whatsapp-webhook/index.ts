// Incoming WhatsApp (0071; owner 2026-10-29 "make a whatsapp tab on the app"): 360dialog posts every message to
// the office number, and the delivery status of every message we send, here (Meta's webhook format). Public
// (no Supabase sign-in: 360dialog calls it), so it trusts only requests carrying the secret header 360dialog
// was configured with (WHATSAPP_WEBHOOK_SECRET; set by whatsapp-send's "setup-webhook"). Writes whatsapp_messages only.
import { serviceClient } from "../_shared/auth.ts";

const STATUS_RANK: Record<string, number> = { sent: 1, delivered: 2, read: 3, failed: 4 };

Deno.serve(async (req) => {
  const secret = Deno.env.get("WHATSAPP_WEBHOOK_SECRET");
  if (req.method !== "POST" || !secret || req.headers.get("x-asp-webhook") !== secret) return new Response("forbidden", { status: 403 });
  // deno-lint-ignore no-explicit-any
  let body: any;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
  const sb = serviceClient();
  for (const entry of body?.entry || []) {
    for (const change of entry?.changes || []) {
      const v = change?.value || {};
      const names = new Map((v.contacts || []).map((c: { wa_id?: string; profile?: { name?: string } }) => [c.wa_id, c.profile?.name || null]));
      // Messages to the office number; and (coexistence) ones the office sent from the phone app.
      const incoming = (v.messages || []).map((m: Msg) => row(m, "in", m.from, names.get(m.from) as string | null));
      const echoes = (v.message_echoes || []).map((m: Msg) => row(m, "out", m.to || "", null));
      const rows = [...incoming, ...echoes].filter((r) => r.wa_id && r.contact);
      if (rows.length) await sb.from("whatsapp_messages").upsert(rows, { onConflict: "wa_id", ignoreDuplicates: true });
      for (const st of v.statuses || []) {
        if (!st?.id || !STATUS_RANK[st.status]) continue;
        const { data: cur } = await sb.from("whatsapp_messages").select("status").eq("wa_id", st.id).maybeSingle();
        if (cur && (STATUS_RANK[cur.status] || 0) >= STATUS_RANK[st.status] && st.status !== "failed") continue; // never step back (read -> delivered)
        const error = st.status === "failed" ? (st.errors || []).map((e: { title?: string; message?: string; code?: number }) => `${e.code ?? ""} ${e.message || e.title || ""}`.trim()).join("; ") || "failed" : null;
        await sb.from("whatsapp_messages").update({ status: st.status, error, updated_at: new Date().toISOString() }).eq("wa_id", st.id);
      }
    }
  }
  return new Response("ok");
});

type Media = { id?: string; mime_type?: string; caption?: string; filename?: string };
type Msg = { id?: string; from?: string; to?: string; timestamp?: string; type?: string;
  text?: { body?: string }; button?: { text?: string }; interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
  image?: Media; video?: Media; audio?: Media; voice?: Media; sticker?: Media; document?: Media;
  reaction?: { emoji?: string; message_id?: string }; location?: { name?: string; address?: string } };

function row(m: Msg, direction: "in" | "out", contact: string | undefined, name: string | null) {
  const t = m.type || "text";
  const media = (m as Record<string, unknown>)[t] as Media | undefined;
  const mediaId = ["image", "video", "audio", "voice", "sticker", "document"].includes(t) ? media?.id || null : null;
  const body = (t === "reaction" ? (m.reaction?.emoji ? `Reacted ${m.reaction.emoji}` : "Removed a reaction") : undefined) ?? m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title
    ?? m.image?.caption ?? m.video?.caption ?? m.document?.caption ?? m.document?.filename
    ?? (m.location ? [m.location.name, m.location.address].filter(Boolean).join(", ") : null) ?? null;
  return { wa_id: m.id, direction, contact: String(contact || "").replace(/\D/g, ""), contact_name: name, body: body ?? `[${t}]`, kind: t, media_id: mediaId, media_mime: mediaId ? media?.mime_type || null : null,
    status: direction === "in" ? "received" : "sent", created_at: m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : new Date().toISOString() };
}
