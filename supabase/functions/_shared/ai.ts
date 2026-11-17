// A daily cap on AI use (0100, audit #13.3). Call aiTake before calling the model and aiRecord after.
// Caps are per feature per New York day; a secret AI_DAILY_<FEATURE> (e.g. AI_DAILY_INBOX_SCAN=500) overrides one.
// If the allowance can't be checked (database error) the call is refused: better a retry than an open tap.
// deno-lint-ignore no-explicit-any
type Sb = any;

const CAPS: Record<string, number> = {
  "inbox-scan": 300,        // ~15 emails a day in practice; a stuck retry loop stops here
  "parse-lead": 150,
  "parse-gig-info": 100,
  "parse-travel-docs": 100,
  "venue-lookup": 150,
};

export function aiCap(feature: string): number {
  const env = Number(Deno.env.get(`AI_DAILY_${feature.toUpperCase().replace(/-/g, "_")}`));
  return Number.isFinite(env) && env > 0 ? Math.floor(env) : (CAPS[feature] ?? 100);
}

export async function aiTake(sb: Sb, feature: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await sb.rpc("ai_take", { p_feature: feature, p_cap: aiCap(feature) });
  if (error) { console.error("ai_take", feature, error.message); return { ok: false, error: "Couldn't check today's AI allowance; try again in a minute." }; }
  if (data !== true) return { ok: false, error: `Today's AI limit for this feature (${aiCap(feature)}) is used up; it resets at midnight New York time.` };
  return { ok: true };
}

// deno-lint-ignore no-explicit-any
export async function aiRecord(sb: Sb, feature: string, usage: any): Promise<void> {
  if (!usage) return;
  const inTok = (Number(usage.input_tokens) || 0) + (Number(usage.cache_read_input_tokens) || 0) + (Number(usage.cache_creation_input_tokens) || 0);
  const { error } = await sb.rpc("ai_record", { p_feature: feature, p_in: inTok, p_out: Number(usage.output_tokens) || 0 });
  if (error) console.error("ai_record", feature, error.message);
}
