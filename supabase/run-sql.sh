#!/bin/bash
# Runs one SQL file against the asp-bookings Supabase database (Management API) and prints the result.
#   supabase/run-sql.sh supabase/migrations/0044_something.sql
# Needs a Supabase personal access token in ~/.asp-secrets/supabase_token (never commit it).
# Migrations: fill in the file's "-- Applied:" line and the ledger in supabase/README.md afterwards.
set -euo pipefail
[ -f "${1:-}" ] || { echo "usage: $0 <file.sql>"; exit 1; }
python3 -c 'import json,sys; print(json.dumps({"query": open(sys.argv[1]).read()}))' "$1" |
  curl -sS -X POST "https://api.supabase.com/v1/projects/psgpxbkncuavlnpplykf/database/query" \
    -H "Authorization: Bearer $(cat ~/.asp-secrets/supabase_token)" \
    -H "Content-Type: application/json" -H "User-Agent: asp-bookings-sql" --data @-
echo
