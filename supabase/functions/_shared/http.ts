// Request/response helpers for the browser-called Edge Functions (2026-10-09 audit 1.8 / 5.6).
//
// CORS is locked to the app's own origin, not "*": APP_URL's origin (https://app.aspmgmt.com), plus
// http://localhost / 127.0.0.1 on any port (the test harness and local development), plus any extra
// origins in the ALLOWED_ORIGINS secret (comma-separated). Another origin gets no
// Access-Control-Allow-Origin header, so the browser refuses the response. CORS is not the security
// boundary -- every function still requires a signed-in admin's token -- it stops other websites
// from driving a signed-in admin's browser.
import { appUrl } from "./config.ts";

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function allowedOrigin(req: Request): string | null {
  const origin = req.headers.get("Origin");
  if (!origin) return null;
  const allowed = [new URL(appUrl()).origin,
    ...(Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map((s) => s.trim()).filter(Boolean)];
  return allowed.includes(origin) || LOCAL_ORIGIN.test(origin) ? origin : null;
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = allowedOrigin(req);
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

// The browser's automatic CORS preflight (OPTIONS) -- without an answer every call fails with only
// "Failed to fetch" in the app.
export function preflight(req: Request): Response {
  return new Response("ok", { headers: corsHeaders(req) });
}

export type Json = (body: unknown, status?: number) => Response;

// json(body, status) bound to this request's CORS headers.
export function jsonFor(req: Request): Json {
  const headers = { ...corsHeaders(req), "Content-Type": "application/json" };
  return (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try { return await req.json(); } catch { return null; }
}
