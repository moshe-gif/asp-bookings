// Mercury, ASP's bank (migration 0067, ops/MERCURY_SETUP.md). Plain fetch against the REST API.
//
// Function Secrets: MERCURY_API_TOKEN (a Mercury API token; read-only is enough to watch money come
// in, moving money between ASP's own accounts needs one allowed to move money),
// MERCURY_API_BASE (optional; https://api-sandbox.mercury.com/api/v1 for Mercury's sandbox),
// MERCURY_LIVE (exactly "yes" lets an approved transfer move real money; until then approving one on
// the real bank only records what would have moved -- the app's test mode, owner 2026-10-14).

const PROD = "https://api.mercury.com/api/v1";

export function mercuryConfigured(): boolean {
  return !!Deno.env.get("MERCURY_API_TOKEN");
}
function base(): string {
  const b = (Deno.env.get("MERCURY_API_BASE") || PROD).replace(/\/+$/, "");
  // Only Mercury's own hosts: the token is sent to whatever this is.
  if (!/^https:\/\/api(-sandbox)?\.mercury\.com\/api\/v1$/.test(b)) throw new Error("MERCURY_API_BASE must be Mercury's API");
  return b;
}
export function mercurySandbox(): boolean {
  return base() !== PROD;
}
// Real money moves only on the sandbox or once the owner says go live.
export function mercuryCanMoveMoney(): boolean {
  return mercurySandbox() || Deno.env.get("MERCURY_LIVE") === "yes";
}

// deno-lint-ignore no-explicit-any
export type MercuryResult = { ok: boolean; status: number; data: any };
export async function mercuryApi(method: "GET" | "POST", path: string, body?: unknown): Promise<MercuryResult> {
  const token = Deno.env.get("MERCURY_API_TOKEN");
  if (!token) return { ok: false, status: 500, data: { error: "Mercury is not configured" } };
  try {
    const r = await fetch(`${base()}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    let data: unknown = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { error: text.slice(0, 300) }; }
    return { ok: r.ok, status: r.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { error: String((err as Error)?.message || err).slice(0, 300) } };
  }
}
export function mercuryError(r: MercuryResult): string {
  const d = r.data || {};
  return String(d.errors?.message || d.message || d.error || `Mercury answered ${r.status}`).slice(0, 300);
}
