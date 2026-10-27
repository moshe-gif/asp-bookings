#!/bin/bash
# Sets one Edge Function secret from the CLIPBOARD, so a key never appears in a chat, a terminal
# history or a file. Copy the key (e.g. in Stripe's dashboard), then:
#   supabase/set-secret.sh STRIPE_SECRET_KEY
# Needs a Supabase personal access token in ~/.asp-secrets/supabase_token (never commit it).
# Prints only the key's first characters, as a check that the right thing was copied.
set -euo pipefail
NAME="${1:-}"
[[ "$NAME" =~ ^[A-Z][A-Z0-9_]*$ ]] || { echo "usage: $0 SECRET_NAME   (the value is read from the clipboard)"; exit 1; }
VALUE="$(pbpaste | tr -d '[:space:]')"
[ -n "$VALUE" ] || { echo "The clipboard is empty: copy the key first."; exit 1; }
[[ "$VALUE" == *set-secret* ]] && { echo "The clipboard holds this command, not the key. Copy the key itself, then run the command again."; exit 1; }
case "$NAME" in
  STRIPE_SECRET_KEY)      [[ "$VALUE" =~ ^(sk|rk)_(test|live)_ ]] || { echo "That isn't a Stripe secret key (sk_test_… / sk_live_…)."; exit 1; } ;;
  STRIPE_PUBLISHABLE_KEY) [[ "$VALUE" =~ ^pk_(test|live)_ ]]      || { echo "That isn't a Stripe publishable key (pk_test_… / pk_live_…)."; exit 1; } ;;
  STRIPE_WEBHOOK_SECRET)  [[ "$VALUE" =~ ^whsec_ ]]               || { echo "That isn't a Stripe webhook signing secret (whsec_…)."; exit 1; } ;;
  RESEND_API_KEY)         [[ "$VALUE" =~ ^re_ ]]                  || { echo "That isn't a Resend API key (re_…)."; exit 1; } ;;
  ANTHROPIC_API_KEY)      [[ "$VALUE" =~ ^sk-ant- ]]              || { echo "That isn't an Anthropic API key (sk-ant-…)."; exit 1; } ;;
  GMAIL_CLIENT_SECRET)    [[ "$VALUE" =~ ^GOCSPX- ]]              || { echo "That isn't a Google client secret (GOCSPX-…). Copy the secret itself, then run this again."; exit 1; } ;;
  MERCURY_API_TOKEN)      [[ "$VALUE" =~ ^secret-token: ]]        || { echo "That isn't a Mercury API token (secret-token:…)."; exit 1; } ;;
  GMAIL_CLIENT_ID)        [[ "$VALUE" =~ \.apps\.googleusercontent\.com$ ]] || { echo "That isn't a Google client ID (…apps.googleusercontent.com)."; exit 1; } ;;
esac
python3 -c 'import json,sys; print(json.dumps([{"name": sys.argv[1], "value": sys.argv[2]}]))' "$NAME" "$VALUE" |
  curl -sS -X POST "https://api.supabase.com/v1/projects/psgpxbkncuavlnpplykf/secrets" \
    -H "Authorization: Bearer $(cat ~/.asp-secrets/supabase_token)" \
    -H "Content-Type: application/json" -H "User-Agent: asp-bookings-secrets" --data @- -o /dev/null -w "%{http_code}" |
  { read -r code; [ "$code" = "200" ] || [ "$code" = "201" ] && echo "$NAME set (${VALUE:0:8}…)." || { echo "Supabase answered $code: not set."; exit 1; }; }
