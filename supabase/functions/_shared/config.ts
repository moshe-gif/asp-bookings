// Office-wide config the Edge Functions share (2026-10-09 audit 3.13): the app's URL and the brand /
// sender details. Brand lives in the brand_config table (migration 0015) -- the same rows the app
// prints on documents -- so a sender name or reply-to is changed in one place.

// Where OAuth callbacks send the browser back to. APP_URL secret overrides the production default.
export function appUrl(): string {
  return (Deno.env.get("APP_URL") || "https://app.aspmgmt.com").replace(/\/+$/, "");
}

export type Brand = { key: string; senderName: string; replyTo: string | null };

// The sender for one brand key (only 'asp' since SING was removed, 0055); unknown keys get the default brand. Falls back to
// the seeded ASP values (and the REPLY_TO secret, kept for compatibility) if the table can't be read,
// so email never fails over branding.
// deno-lint-ignore no-explicit-any
export async function brandFor(sb: any, key: string | undefined): Promise<Brand> {
  const fallback: Brand = { key: "asp", senderName: "ASP Management", replyTo: Deno.env.get("REPLY_TO") || "office@aspmgmt.com" };
  try {
    const { data, error } = await sb.from("brand_config").select("brand_key, is_default, sender_name, display_name, reply_to");
    if (error || !data?.length) return fallback;
    // deno-lint-ignore no-explicit-any
    const row = data.find((r: any) => r.brand_key === key) || data.find((r: any) => r.is_default) || data[0];
    return {
      key: row.brand_key,
      senderName: row.sender_name || row.display_name || fallback.senderName,
      replyTo: row.reply_to || fallback.replyTo,
    };
  } catch {
    return fallback;
  }
}
