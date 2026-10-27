#!/bin/bash
# Sets Edge Function secrets without the values ever being shown, logged or pasted into a chat:
# it asks for each one with hidden typing and sends it straight to Supabase.
#
#   supabase/set-secrets.sh STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY
#
# Needs a Supabase personal access token in ~/.asp-secrets/supabase_token (same as deploy-function.sh).
set -euo pipefail
REF=psgpxbkncuavlnpplykf
TOKEN=$(cat ~/.asp-secrets/supabase_token)
[ $# -gt 0 ] || { echo "usage: $0 SECRET_NAME..."; exit 1; }
for name in "$@"; do
  [[ "$name" =~ ^[A-Z][A-Z0-9_]*$ ]] || { echo "bad secret name: $name"; exit 1; }
  printf "Paste %s (hidden), then press Enter: " "$name"
  IFS= read -rs value; echo
  [ -n "$value" ] || { echo "empty -- skipped $name"; continue; }
  body=$(NAME="$name" VALUE="$value" python3 -c 'import json,os; print(json.dumps([{"name":os.environ["NAME"],"value":os.environ["VALUE"].strip()}]))')
  code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "https://api.supabase.com/v1/projects/$REF/secrets" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "User-Agent: asp-bookings-secrets" --data-binary @- <<<"$body")
  unset value body
  [ "$code" = "201" ] || [ "$code" = "200" ] && echo "$name saved." || echo "$name NOT saved (Supabase answered $code)."
done
