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
# Deploys only committed, pushed code (2026-11-12 audit #15.2): it used to upload whatever was on disk,
# uncommitted edits included, with no record of what went live. Each deploy is now recorded in the
# deployed_functions table (0093) with its git commit, so "what is live" can be answered and rolled back.
set -euo pipefail
cd "$(dirname "$0")/functions"
REF=psgpxbkncuavlnpplykf
TOKEN=$(cat ~/.asp-secrets/supabase_token)
if [ -n "$(git status --porcelain -- .)" ]; then
  echo "Refusing: supabase/functions has uncommitted changes. Commit (and push) them first."; git status --short -- .; exit 1
fi
git fetch -q origin main
git merge-base --is-ancestor HEAD origin/main || { echo "Refusing: this commit isn't on origin/main yet. Push first."; exit 1; }
SHA=$(git rev-parse HEAD)
PUBLIC=" library-drive-backup mercury whatsapp-webhook qbo-oauth-callback gcal-oauth-callback gmail-oauth-callback qbo-webhook contract-sign client-pay payee-onboard stripe-webhook client-followups inbox-scan gig-form axis-feed cal-feed "

slugs=("$@")
if [ "${1:-}" = "all" ]; then slugs=($(ls -d */ | tr -d / | grep -v '^_shared$')); fi
[ ${#slugs[@]} -gt 0 ] || { echo "usage: $0 <function-name>... | all"; exit 1; }

shared=()
for f in _shared/*.ts; do shared+=(-F "file=@$f;filename=$f"); done

failed=0
for slug in "${slugs[@]}"; do
  [ -f "$slug/index.ts" ] || { echo "no such function: $slug"; exit 1; }
  jwt=true; [[ "$PUBLIC" == *" $slug "* ]] && jwt=false
  printf "%-22s jwt=%-5s " "$slug" "$jwt"
  out=$(curl -sS -X POST "https://api.supabase.com/v1/projects/$REF/functions/deploy?slug=$slug" \
    -H "Authorization: Bearer $TOKEN" -H "User-Agent: asp-bookings-deploy" \
    -F "metadata={\"entrypoint_path\":\"$slug/index.ts\",\"name\":\"$slug\",\"verify_jwt\":$jwt};type=application/json" \
    -F "file=@$slug/index.ts;filename=$slug/index.ts" "${shared[@]}" |
    python3 -c 'import sys,json; d=json.load(sys.stdin); print("v%s %s" % (d["version"], d["status"]) if "version" in d else "FAILED: " + str(d.get("message", d))[:300])')
  echo "$out"
  ver=$(sed -n 's/^v\([0-9][0-9]*\) .*/\1/p' <<<"$out")
  [ -n "$ver" ] || { failed=1; continue; }
  python3 -c 'import json,sys; print(json.dumps({"query": "insert into public.deployed_functions (slug, git_sha, version) values (%s, %s, %s);" % (repr(sys.argv[1]), repr(sys.argv[2]), sys.argv[3])}))' "$slug" "$SHA" "$ver" |
    curl -sS -X POST "https://api.supabase.com/v1/projects/$REF/database/query" -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" -H "User-Agent: asp-bookings-deploy" --data @- | grep -q '"message"' && echo "  (deploy record failed)"
done
exit $failed
