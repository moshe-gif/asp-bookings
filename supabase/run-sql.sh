#!/bin/bash
# Runs one SQL file against the asp-bookings Supabase database (Management API) and prints the result.
#   supabase/run-sql.sh supabase/migrations/0044_something.sql
#   supabase/run-sql.sh /path/to/read-only-check.sql
# Needs a Supabase personal access token in ~/.asp-secrets/supabase_token (never commit it).
# Exits non-zero when the database returns an error (it used to exit 0 and look applied).
# A file under supabase/migrations/ must be committed first; once it succeeds it is recorded in the
# schema_migrations table (0093) with the commit it came from -- the database's own record of what ran.
# Still fill in the file's "-- Applied:" line afterwards.
set -euo pipefail
[ -f "${1:-}" ] || { echo "usage: $0 <file.sql>"; exit 1; }
FILE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
cd "$(dirname "$0")/.."
TOKEN=$(cat ~/.asp-secrets/supabase_token)
API="https://api.supabase.com/v1/projects/psgpxbkncuavlnpplykf/database/query"

query() {  # $1 = SQL text; prints the result, exits 1 on a database error
  python3 -c 'import json,sys; print(json.dumps({"query": sys.stdin.read()}))' <<<"$1" |
    curl -sS -X POST "$API" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
      -H "User-Agent: asp-bookings-sql" --data @- |
    python3 -c 'import sys,json
raw=sys.stdin.read(); print(raw)
try: d=json.loads(raw)
except Exception: sys.exit(1)
sys.exit(1 if isinstance(d,dict) and ("message" in d or "error" in d) else 0)'
}

version=""
case "$(dirname "$FILE")/" in
  */supabase/migrations/)
    version=$(basename "$FILE" .sql)
    rel="supabase/migrations/$(basename "$FILE")"
    if ! git ls-files --error-unmatch "$rel" >/dev/null 2>&1 || ! git diff --quiet HEAD -- "$rel"; then
      echo "Refusing: commit $rel first (the ledger records the commit it was applied from)."; exit 1
    fi ;;
esac

query "$(cat "$FILE")" || { echo "FAILED: the database returned an error (nothing recorded)."; exit 1; }
echo
if [ -n "$version" ]; then
  sha=$(git rev-parse HEAD)
  query "insert into public.schema_migrations (version, git_sha) values ('$version', '$sha')
         on conflict (version) do update set applied_at = now(), git_sha = excluded.git_sha;" >/dev/null &&
    echo "Recorded $version in schema_migrations ($sha)."
fi
