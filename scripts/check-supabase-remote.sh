#!/bin/bash
# Vérifie tables / vues / RPC Supabase via REST API (service role).
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "❌ .env.local introuvable"
  exit 1
fi

# shellcheck disable=SC1091
set -a && source .env.local && set +a

URL="${NEXT_PUBLIC_SUPABASE_URL:?}"
KEY="${SUPABASE_SERVICE_ROLE_KEY:?}"
BASE="$URL/rest/v1"

check_rest() {
  local method="$1" path="$2" body="${3:-}"
  local args=(-s -w "\n%{http_code}" -X "$method" "$BASE/$path")
  args+=(-H "apikey: $KEY" -H "Authorization: Bearer $KEY")
  if [[ -n "$body" ]]; then
    args+=(-H "Content-Type: application/json" -d "$body")
  fi
  local raw code resp
  raw=$(curl "${args[@]}")
  code=$(echo "$raw" | tail -n1)
  resp=$(echo "$raw" | sed '$d')
  echo "$code|$resp"
}

check_table() {
  local name="$1"
  local result code body
  result=$(check_rest GET "${name}?select=*&limit=0")
  code=$(echo "$result" | cut -d'|' -f1)
  body=$(echo "$result" | cut -d'|' -f2-)
  if [[ "$code" == "200" ]]; then
    echo "✅ table/view: $name"
  else
    echo "❌ table/view: $name (HTTP $code) $body"
  fi
}

check_rpc() {
  local name="$1" payload="${2:-{}}"
  local result code body
  result=$(check_rest POST "rpc/$name" "$payload")
  code=$(echo "$result" | cut -d'|' -f1)
  body=$(echo "$result" | cut -d'|' -f2-)
  if echo "$body" | grep -q 'PGRST202'; then
    echo "❌ rpc: $name (absente)"
  elif [[ "$code" == "200" || "$code" == "204" || "$code" == "400" || "$code" == "401" || "$code" == "403" || "$code" == "404" || "$code" == "409" ]]; then
    # 400/403 = fonction existe, params ou droits refusés
    echo "✅ rpc: $name (présente — HTTP $code)"
  else
    echo "⚠️  rpc: $name (HTTP $code) $body"
  fi
}

echo ""
echo "=== AsblOS — vérif Supabase distante ==="
echo "Projet: $URL"
echo ""

echo "--- Tables / vues clés ---"
for t in \
  profiles children guardians memberships payments logs_audit \
  staff_time_entries staff_time_contracts staff_time_balances staff_time_ledger \
  staff_monthly_flex_report; do
  check_table "$t"
done

echo ""
echo "--- RPC clés ---"
check_rpc "upsert_staff_contract" '{"p_user_id":"00000000-0000-0000-0000-000000000001","p_target_minutes":60,"p_work_days":[1,2,3,4,5]}'
check_rpc "settle_staff_time_all_for_date" '{"p_reference_date":"2020-01-01"}'
check_rpc "settle_staff_time_day" '{"p_user_id":"00000000-0000-0000-0000-000000000001","p_reference_date":"2020-01-01"}'
check_rpc "anonymize_child" '{"p_child_id":"00000000-0000-0000-0000-000000000001"}'
check_rpc "sync_enrollment_paid" '{"p_child_id":"00000000-0000-0000-0000-000000000001","p_membership_id":"00000000-0000-0000-0000-000000000002"}'
check_rpc "get_child_enrollment_state" '{"p_child_id":"00000000-0000-0000-0000-000000000001","p_school_year":"2025-2026"}'
check_rpc "create_parent_enrollment_core" '{}'

echo ""
echo "--- C1 enrollment (046) ---"
legacy_col=$(check_rest GET "children?select=enrollment_status&limit=0")
legacy_code=$(echo "$legacy_col" | cut -d'|' -f1)
legacy_body=$(echo "$legacy_col" | cut -d'|' -f2-)
if echo "$legacy_body" | grep -q 'enrollment_status'; then
  if echo "$legacy_body" | grep -qi 'does not exist\|42703\|column'; then
    echo "✅ children.enrollment_status: colonne absente (046 OK)"
  else
    echo "❌ children.enrollment_status: colonne encore présente — applique 045 puis 046"
  fi
elif [[ "$legacy_code" == "200" ]]; then
  echo "❌ children.enrollment_status: colonne encore présente — applique 046"
else
  echo "⚠️  children.enrollment_status: vérif inconclusive (HTTP $legacy_code)"
fi

echo ""
echo "--- Auth Admin (création compte équipe) ---"
auth_headers=(-H "apikey: $KEY")
if [[ "$KEY" != sb_secret_* ]]; then
  auth_headers+=(-H "Authorization: Bearer $KEY")
fi
auth_raw=$(curl -s -w "\n%{http_code}" "${auth_headers[@]}" \
  "$URL/auth/v1/admin/users?per_page=1")
auth_code=$(echo "$auth_raw" | tail -n1)
auth_body=$(echo "$auth_raw" | sed '$d')
if [[ "$auth_code" == "200" ]]; then
  echo "✅ auth admin: listUsers OK (HTTP 200)"
elif echo "$auth_body" | grep -qi 'bad_jwt\|invalid jwt'; then
  echo "❌ auth admin: clé refusée (bad_jwt) — vérifie SUPABASE_SERVICE_ROLE_KEY"
else
  echo "⚠️  auth admin: HTTP $auth_code — $auth_body"
fi

echo ""
echo "ou le bloc P0 dans supabase/INSTALL.md (section Vérification)."
