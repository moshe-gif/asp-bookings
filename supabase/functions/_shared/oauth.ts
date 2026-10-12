// Shared by the three OAuth callbacks (QuickBooks, Google Calendar, Gmail).
import type { SupabaseClient } from "./deps.ts";

// One-time OAuth `state` issued by the oauth-start function to a signed-in admin (migration 0034).
// Consumed before anything else: an unknown, reused, expired or wrong-provider state is rejected, so
// nobody can complete a connect flow ASP didn't start or attach their own account to ASP's
// connection (2026-10-09 audit 1.2).
export async function consumeOAuthState(sb: SupabaseClient, state: string | null, provider: string) {
  if (!state) return null;
  const { data, error } = await sb.from("oauth_states").delete()
    .eq("nonce", state).eq("provider", provider).gt("expires_at", new Date().toISOString())
    .select("user_id, mailbox_id").maybeSingle();
  if (error) { console.error("OAuth state check failed", error); return null; }
  return data as { user_id: string; mailbox_id: string | null } | null;
}

