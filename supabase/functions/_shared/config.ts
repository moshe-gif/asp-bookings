// Office-wide config the Edge Functions share (2026-10-09 audit 3.13): the app's URL and the brand /
// sender details. Brand lives in the brand_config table (migration 0015) -- the same rows the app
// prints on documents -- so a sender name or reply-to is changed in one place.

// Where OAuth callbacks send the browser back to. APP_URL secret overrides the production default.
export function appUrl(): string {
  return (Deno.env.get("APP_URL") || "https://app.aspmgmt.com").replace(/\/+$/, "");
}

// The ASP logo for emails (dark ink, always on white paper), served by the app itself. Kept small (owner
// 2026-11-09: "cut down on the size of the asp logo in every area"); the artist's name is the headline.
export function brandLogoHtml(width = 110): string {
  return `<img src="${appUrl()}/assets/brand/asp-horizontal-dark.png" alt="ASP Management" width="${width}" style="display:block;width:${width}px;max-width:100%;height:auto;border:0;"/>`;
}

// The artist's name in big type at the top of everything a client gets (owner 2026-11-09): Archivo light + wide
// (the owner turned down a serif) where the mail app loads web fonts (Apple Mail does), else Helvetica.
export const ARTIST_FONT = "Archivo,'Helvetica Neue',Helvetica,Arial,sans-serif";
export const ARTIST_FONT_CSS = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,300..700&display=swap";
const escB = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
export function artistNameHtml(name: string, size = 34): string {
  return name ? `<div style="font-family:${ARTIST_FONT};font-size:${size}px;font-weight:300;font-stretch:112%;line-height:1.1;letter-spacing:-.02em;color:#0B1B2B;margin:10px 0 0;overflow-wrap:anywhere;">${escB(name)}</div>` : "";
}
// The top of a client email: the small dark logo, then the artist's name (if any).
export function emailHeaderHtml(artist = ""): string {
  return `<style>@import url('${ARTIST_FONT_CSS}');</style>${brandLogoHtml()}${artistNameHtml(artist)}`;
}
// Client email subjects lead with the artist (owner 2026-11-09: "benny friedman via asp").
export function viaAsp(artist: string, what = ""): string {
  return `${artist ? `${artist} via ASP` : "ASP Management"}${what ? ` — ${what}` : ""}`;
}
// The artists on a gig ("Benny Friedman & Moshe"), by its legacy id; "" when unknown.
// deno-lint-ignore no-explicit-any
export async function gigArtistNames(sb: any, gig: string | null | undefined): Promise<string> {
  if (!gig) return "";
  try {
    const { data: e } = await sb.from("events").select("artist_id, app_doc").eq("legacy_id", gig).maybeSingle();
    if (!e) return "";
    // deno-lint-ignore no-explicit-any
    const refs = [e.artist_id || e.app_doc?.artistId, ...((e.app_doc?.additionalArtists || []).map((x: any) => x?.artistId))].filter(Boolean).map(String);
    if (!refs.length) return "";
    const { data: artists } = await sb.from("artists").select("id, legacy_id, name");
    // deno-lint-ignore no-explicit-any
    return refs.map((r) => (artists || []).find((a: any) => a.id === r || a.legacy_id === r)?.name).filter(Boolean).join(" & ");
  } catch { return ""; }
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
