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

// What the client still owes the MAIN artist: artistPayout() in the app (fee less ASP's commission,
// plus the gig's extra charges), in cents.
export function mainBalanceCentsOf(ev: Doc): number {
  const charges = (ev.charges || []).reduce((s: number, c: Doc) => s + (Number(c?.amount) || 0), 0);
  return Math.round(((Number(ev.price) || 0) - (Number(ev.commission) || 0) + charges) * 100);
}
// A gig with more than one artist (ev.additionalArtists, each {artistId, feeAmount, aspCut}).
export function isMultiArtist(ev: Doc): boolean {
  return Array.isArray(ev.additionalArtists) && ev.additionalArtists.some((x: Doc) => x && x.artistId);
}
const extraArtists = (ev: Doc): Doc[] => (Array.isArray(ev.additionalArtists) ? ev.additionalArtists : []).filter((x: Doc) => x && x.artistId);
// Each additional artist's share of the balance: their fee less ASP's cut (both frozen on the gig when
// it was made). The deposit covers ASP's cut from every artist. null when a figure is missing.
function extraNetCents(x: Doc): number | null {
  const fee = Number(x.feeAmount), cut = Number(x.aspCut);
  if (!Number.isFinite(fee) || !Number.isFinite(cut) || x.aspCut == null) return null;
  return Math.round((fee - cut) * 100);
}
// What the client owes for the whole gig: the main artist's balance plus each additional artist's
// share (clientBalanceDue() in the app). NaN when an additional artist's figures are missing.
export function balanceCentsOf(ev: Doc): number {
  let total = mainBalanceCentsOf(ev);
  for (const x of extraArtists(ev)) { const n = extraNetCents(x); if (n == null) return NaN; total += n; }
  return total;
}

// The deposit the gig's contract asked for, in cents (contractPaymentFigures() in the app: a percent of
// the contract's fee, else its $ amount) -- its newest signed contract, else sent, else any live one.
// Without a contract (or one with no deposit), ASP's cut from every artist: the usual deposit.
// Money a client paid early on top of the deposit counts as deposit (owner 2026-10-27): once the
// deposit is received, ev.depositPaid (everything received so far) replaces the contract's figure.
export function depositCentsOf(ev: Doc, contracts: Doc[]): number {
  if (ev.depositReceived && Number(ev.depositPaid) > 0) return Math.round(Number(ev.depositPaid) * 100);
  const live = contracts.filter((c) => c && c.status !== "void").sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const c = live.find((x) => x.status === "signed") || live.find((x) => x.status === "sent") || live[0];
  if (c && c.fee && c.deposit) {
    const total = Number(c.fee.amount) || 0;
    const dep = Number(c.deposit.percent) > 0 ? Math.round(total * Number(c.deposit.percent) / 100) : Number(c.deposit.amount) || 0;
    if (dep > 0) return Math.round(dep * 100);
  }
  return Math.round(((Number(ev.commission) || 0) + extraArtists(ev).reduce((t, x) => t + (Number(x.aspCut) || 0), 0)) * 100);
}
// What the client owes after the deposit: every artist's fee plus the gig's charges, less the deposit
// (owner's EV-5020: a 25% contract deposit leaves less than fee-less-commission). NaN when an
// additional artist's figures are missing.
export function clientOwedCentsOf(ev: Doc, contracts: Doc[]): number {
  const nets = balanceCentsOf(ev);
  if (!Number.isFinite(nets)) return NaN;
  const cuts = Math.round(((Number(ev.commission) || 0) + extraArtists(ev).reduce((t, x) => t + (Number(x.aspCut) || 0), 0)) * 100);
  return nets + cuts - depositCentsOf(ev, contracts);
}
export async function gigContracts(sb: Sb, eventLegacyId: string): Promise<Doc[]> {
  const { data } = await sb.from("app_records").select("app_doc").eq("collection", "contracts").eq("app_doc->>leadId", eventLegacyId);
  return (data || []).map((r: Doc) => r.app_doc).filter(Boolean);
}

// Who gets what of the balance the client pays (owner 2026-10-16: one payment, split automatically):
// each artist's own share -- the main artist's (fee − commission + charges) to the gig's balance payee,
// each additional artist's (fee − ASP's cut) to that artist's own payee profile -- adjusted by how far
// the deposit was from ASP's cut. A deposit SMALLER than ASP's cut leaves ASP's rest in this payment
// (aspCents, kept by ASP). A deposit BIGGER than ASP's cut means ASP already holds part of the
// artists' money: it comes off the main artist's share here (then the next ones') and ASP pays it to
// them itself (heldByAspCents). Shares of 0 are left out. null when a payee or a figure is missing.
export type SplitPart = { payeeProfileId: string; cents: number; name: string };
export type Split = { parts: SplitPart[]; aspCents: number; heldByAspCents: number; totalCents: number };
export async function balanceSplit(sb: Sb, eventLegacyId: string, ev: Doc): Promise<Split | null> {
  const parts = await artistShares(sb, eventLegacyId, ev);
  if (!parts) return null;
  const totalCents = clientOwedCentsOf(ev, await gigContracts(sb, eventLegacyId));
  if (!Number.isFinite(totalCents)) return null;
  const shares = parts.reduce((t, p) => t + p.cents, 0);
  let aspCents = 0, heldByAspCents = 0;
  if (totalCents >= shares) aspCents = totalCents - shares;
  else {
    heldByAspCents = shares - totalCents;
    let left = heldByAspCents;
    for (const p of parts) { const take = Math.min(p.cents, left); p.cents -= take; left -= take; }
    if (left > 0) return null;   // the deposit was more than the whole gig
  }
  return { parts: parts.filter((p) => p.cents > 0), aspCents, heldByAspCents, totalCents };
}

// Each artist's whole share of the gig, before any deposit adjustment: the main artist's (fee −
// commission + charges) to the gig's balance payee, each additional artist's (fee − ASP's cut) to their
// own payee profile. What a gig paid in full into ASP's own bank owes the artists (mercury-split).
// null when a payee or a figure is missing.
export async function artistShares(sb: Sb, eventLegacyId: string, ev: Doc): Promise<SplitPart[] | null> {
  const main = await balancePayeeProfile(sb, eventLegacyId, ev);
  if (!main?.id) return null;
  const parts: SplitPart[] = [{ payeeProfileId: main.id, cents: mainBalanceCentsOf(ev), name: main.entityName || "" }];
  const extras = extraArtists(ev);
  if (extras.length) {
    const { data: pRows } = await sb.from("app_records").select("app_doc").eq("collection", "payee_profiles");
    const profiles = (pRows || []).map((r: Doc) => r.app_doc).filter(Boolean);
    for (const x of extras) {
      const prof = profiles.find((p: Doc) => p.artistId === x.artistId);
      const cents = extraNetCents(x);
      if (!prof?.id || cents == null || cents < 0) return null;
      parts.push({ payeeProfileId: prof.id, cents, name: prof.entityName || "" });
    }
  }
  return parts.some((p) => p.cents < 0) ? null : parts;
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

// Where artists' balances go (Settings → Mercury, owner 2026-10-27): 'mercury' = every balance paid
// online is ASP's (its own Stripe account, paid out to its main Mercury account) and the mercury
// function splits each artist's share into their own Mercury account; otherwise each artist's own
// Stripe account (Stripe Connect, above).
export async function payoutViaMercury(sb: Sb): Promise<boolean> {
  const { data } = await sb.from("app_records").select("app_doc").eq("collection", "settings").eq("legacy_id", "org").maybeSingle();
  return data?.app_doc?.value?.payoutVia === "mercury";
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

// The Stripe accounts a split goes to, one entry per account (two profiles of one company share an
// account, so their shares add up): null unless every one of them can receive money right now.
export async function splitAccounts(sb: Sb, parts: SplitPart[], live: boolean): Promise<{ account: string; cents: number }[] | null> {
  const out = new Map<string, number>();
  for (const p of parts) {
    const acct = await payableAccount(sb, p.payeeProfileId, live);
    if (!acct) return null;
    out.set(acct, (out.get(acct) || 0) + p.cents);
  }
  return [...out].map(([account, cents]) => ({ account, cents }));
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
