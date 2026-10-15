#!/bin/bash
# Deploys Edge Functions WITH the shared modules they import (supabase/functions/_shared/*.ts).
# Pasting index.ts into the dashboard no longer works: the bundler needs the _shared files too.
#
#   supabase/deploy-function.sh send-contract-email          # one function
#   supabase/deploy-function.sh all                          # every function
#
# Needs a Supabase personal access token in ~/.asp-secrets/supabase_token (never commit it).
# JWT verification stays OFF for the public endpoints (OAuth callbacks, QuickBooks webhook) and ON
# for everything else -- see supabase/README.md.
set -euo pipefail
cd "$(dirname "$0")/functions"
REF=psgpxbkncuavlnpplykf
TOKEN=$(cat ~/.asp-secrets/supabase_token)
PUBLIC=" qbo-oauth-callback gcal-oauth-callback gmail-oauth-callback qbo-webhook contract-sign client-pay stripe-webhook client-followups inbox-scan "

slugs=("$@")
if [ "${1:-}" = "all" ]; then slugs=($(ls -d */ | tr -d / | grep -v '^_shared$')); fi
[ ${#slugs[@]} -gt 0 ] || { echo "usage: $0 <function-name>... | all"; exit 1; }

shared=()
for f in _shared/*.ts; do shared+=(-F "file=@$f;filename=$f"); done

for slug in "${slugs[@]}"; do
  [ -f "$slug/index.ts" ] || { echo "no such function: $slug"; exit 1; }
  jwt=true; [[ "$PUBLIC" == *" $slug "* ]] && jwt=false
  printf "%-22s jwt=%-5s " "$slug" "$jwt"
  curl -sS -X POST "https://api.supabase.com/v1/projects/$REF/functions/deploy?slug=$slug" \
    -H "Authorization: Bearer $TOKEN" -H "User-Agent: asp-bookings-deploy" \
    -F "metadata={\"entrypoint_path\":\"$slug/index.ts\",\"name\":\"$slug\",\"verify_jwt\":$jwt};type=application/json" \
    -F "file=@$slug/index.ts;filename=$slug/index.ts" "${shared[@]}" |
    python3 -c 'import sys,json; d=json.load(sys.stdin); print("v%s %s" % (d["version"], d["status"]) if "version" in d else "FAILED: " + str(d.get("message", d))[:300])'
done
