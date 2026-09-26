#!/usr/bin/env bash
# Re-creates the Boutik demo accounts and data on a Supabase project.
#   SUPABASE_ACCESS_TOKEN  - Management API token (to run SQL)
#   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY - to create the auth users
#   PROJECT_REF            - e.g. rfreiczzgdedawrxyggu
set -euo pipefail
cd "$(dirname "$0")/.."
: "${PROJECT_REF:?}" "${SUPABASE_URL:?}" "${SUPABASE_SERVICE_ROLE_KEY:?}" "${SUPABASE_ACCESS_TOKEN:?}"

sql() {
  jq -n --arg q "$1" '{query:$q}' | curl -sf -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H 'Content-Type: application/json' --data-binary @-
}

for f in supabase/migrations/*.sql; do echo "migration $f"; sql "$(cat "$f")" >/dev/null; done

create_user() { # email password display_name id
  curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H 'Content-Type: application/json' \
    -d "$(jq -n --arg e "$1" --arg p "$2" --arg n "$3" --arg id "$4" '{id:$id,email:$e,password:$p,email_confirm:true,user_metadata:{name:$n}}')" >/dev/null || true
}
create_user demo@boutik.cd demo1234 "Maman Nzuzi" df29518f-49ab-48d0-85e9-a1e6e4e8688d
create_user vendeur@boutik.cd demo1234 "Patrick (vendeur)" 73841849-c542-49e9-a607-b6abfa682483

echo "seed"; sql "$(cat supabase/seed.sql)" >/dev/null
echo done
