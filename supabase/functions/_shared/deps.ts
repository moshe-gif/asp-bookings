// Third-party imports for every Edge Function, pinned to one exact version (2026-10-09 audit 5.6):
// an unpinned @2 changes underneath a deployed function on any upstream release. Same supabase-js
// version as the frontend (frontend/index.html). Bump deliberately, here only.
export { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.3";
export type { SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.117.3";
