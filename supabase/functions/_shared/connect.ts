// Balances paid online straight to the artist (Stripe Connect, migration 0063, ops/STRIPE_SETUP.md).
// Each artist's payee profile gets a Stripe Express account (stripe_payees); a balance payment is a
// destination charge: ASP is the business the client pays, and Stripe passes the balance on to the
// artist's account. The server works out every part of that itself -- the gig's balance, its payee
// and that payee's account -- the same way the app does, never from what a browser sends.
import { stripeApi } from "./stripe.ts";

// deno-lint-ignore no-explicit-any
type Sb = any;
// deno-lint-ignore no-explicit-any
type Doc = Record<string, any>;

// What the client still owes the artist: artistPayout() in the app (fee less ASP's commission, plus
// the gig's extra charges), in cents.
export function balanceCentsOf(ev: Doc): number {
  // deno-lint-ignore no-explicit-any
  const charges = (ev.charges || []).reduce((s: number, c: any) => s + (Number(c?.amount) || 0), 0);
  return Math.round(((Number(ev.price) || 0) - (Number(ev.commission) || 0) + charges) * 100);
}

// The gig's balance payee: zellePayeeProfileFor() in the app -- the payee on its latest sent/signed
// contract (the frozen payeeSnapshot), else the artist's own payee profile. Never the house's or
// another artist's.
export async function balancePayeeProfile(sb: Sb, eventLegacyId: string, ev?: Doc | null): Promise<Doc | null> {
  if (!ev) {
    const { data } = await sb.from("events").select("app_doc").eq("legacy_id", eventLegacyId).maybeSingle();
    ev = data?.app_doc || null;
  }
  if (!ev) return null;
  const { data: cRows } = await sb.from("app_records").select("app_doc").eq("collection", "contracts").eq("app_doc->>leadId", eventLegacyId);
  const sent = (cRows || []).map((r: Doc) => r.app_doc).filter((c: Doc) => c && (c.status === "sent" || c.status === "signed"))
    .sort((a: Doc, b: Doc) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
  const { data: pRows } = await sb.from("app_records").select("app_doc").eq("collection", "payee_profiles");
  const profiles = (pRows || []).map((r: Doc) => r.app_doc).filter(Boolean);
  return (sent && (sent.payeeSnapshot || profiles.find((x: Doc) => x.id === sent.payeeProfileId)))
    || profiles.find((x: Doc) => x.artistId && x.artistId === ev!.artistId) || null;
}

// The card fee for a gig: Settings' percent (0-3%), never for a gig in a state that bans surcharges
// (contractCardFeeBps() / normalizeState() in the app).
export function normalizeState(s: unknown): string {
  const t = String(s || "").trim().toUpperCase().replace(/\./g, "").replace(/\s+/g, " ");
  if (["CT", "CONN", "CONNECTICUT"].includes(t)) return "CT";
  if (["MA", "MASS", "MASSACHUSETTS"].includes(t)) return "MA";
  return t;
}
export async function gigCardFeeBps(sb: Sb, ev: Doc): Promise<number> {
  if (["CT", "MA"].includes(normalizeState(ev.state))) return 0;
  const { data } = await sb.from("app_records").select("app_doc").eq("collection", "settings").eq("legacy_id", "org").maybeSingle();
  const pct = Number(data?.app_doc?.value?.cardFeePercent) || 0;
  return Math.round(Math.min(Math.max(pct, 0), 3) * 100);
}

// Stripe's view of a connected account -> the stripe_payees status columns.
export function accountStatus(acct: Doc) {
  const due = [...(acct.requirements?.currently_due || []), ...(acct.requirements?.past_due || [])];
  return {
    details_submitted: !!acct.details_submitted,
    transfers_active: acct.capabilities?.transfers === "active",
    payouts_enabled: !!acct.payouts_enabled,
    requirements_due: due.length ? [...new Set(due)].join(", ").slice(0, 500) : null,
    disabled_reason: acct.requirements?.disabled_reason || null,
    livemode: !!acct.livemode,
    checked_at: new Date().toISOString(),
  };
}

// Re-reads every stripe_payees row on one account from Stripe and stores what it says. Returns the
// account (or null when Stripe can't be reached; the stored status stands).
export async function refreshPayeeAccount(sb: Sb, stripeAccountId: string): Promise<Doc | null> {
  const acct = await stripeApi("GET", `/accounts/${stripeAccountId}`);
  if (!acct.ok) { console.error("connect: read account", stripeAccountId, acct.status, acct.data?.error?.message); return null; }
  const { error } = await sb.from("stripe_payees").update({ ...accountStatus(acct.data), updated_at: new Date().toISOString() }).eq("stripe_account_id", stripeAccountId);
  if (error) console.error("connect: store status", error.message);
  return acct.data;
}

// The account a balance for this payee profile goes to, checked live with Stripe: null unless Stripe
// says it can receive transfers right now (and in the same mode, test or live, as the key).
export async function payableAccount(sb: Sb, payeeProfileId: string, live: boolean): Promise<string | null> {
  const { data: row } = await sb.from("stripe_payees").select("stripe_account_id").eq("payee_profile_id", payeeProfileId).maybeSingle();
  if (!row) return null;
  const acct = await refreshPayeeAccount(sb, row.stripe_account_id);
  if (!acct || acct.capabilities?.transfers !== "active" || !!acct.livemode !== live) return null;
  return row.stripe_account_id;
}

export function balanceDescription(ev: Doc): string {
  const d = ev.date ? new Date(ev.date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : "";
  return `Balance — ${ev.venue || ev.type || "your event"}${d ? ` (${d})` : ""}`.slice(0, 200);
}
