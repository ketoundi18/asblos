#!/usr/bin/env bash
# Vérifie que types/database.ts contient les symboles critiques (sans accès Supabase).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TYPES="$ROOT/types/database.ts"

if [ ! -s "$TYPES" ]; then
  echo "❌ types/database.ts absent ou vide."
  exit 1
fi

REQUIRED=(
  "staff_time_entries"
  "staff_time_contracts"
  "staff_time_ledger"
  "school_support_enrollments"
  "logs_audit"
  "create_parent_enrollment_core"
  "p_membership_plan"
  "sync_enrollment_paid"
  "membership_status"
  "child_enrollment_status"
)

for needle in "${REQUIRED[@]}"; do
  if ! grep -q "$needle" "$TYPES"; then
    echo "❌ types/database.ts — symbole manquant : $needle"
    echo "   Lance : npx supabase login && npm run gen:types"
    exit 1
  fi
done

echo "✅ types/database.ts — sanity check OK ($(wc -l < "$TYPES" | tr -d ' ') lignes)"
