// Matching a payment to the gig it pays -- one rule for every money path (2026-11-12 audit #12).
// An amount alone is not proof: two gigs can owe the same deposit. A match counts as "exact" (and may be
// recorded automatically) only when exactly one gig is due that amount, or exactly one of those gigs fits
// the payer's name or memo. The AI's choice of gig is a suggestion; this is the check.

export const nameTokens = (s: string) => String(s || "").toLowerCase().split(/[^a-z]+/)
  .filter((t) => t.length >= 3 && !["the", "and", "llc", "inc", "family"].includes(t));

export type DueGig = { id: string; due_cents: number; names: string[] };

// Is `chosen` the one gig this payment can belong to? `candidates` = every gig due exactly `cents` for this kind.
export function unambiguousGig(chosen: string, cents: number, candidates: DueGig[], payerText: string): boolean {
  const same = candidates.filter((g) => g.due_cents === cents);
  if (!same.some((g) => g.id === chosen)) return false;
  if (same.length === 1) return true;
  const who = new Set(nameTokens(payerText));
  const named = same.filter((g) => g.names.some((n) => who.has(n)));
  return named.length === 1 && named[0].id === chosen;
}
