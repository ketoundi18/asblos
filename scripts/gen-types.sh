#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/types/database.ts"
TMP="$(mktemp "${TMPDIR:-/tmp}/asblos-database.XXXXXX.ts")"

cleanup() {
  rm -f "$TMP"
}
trap cleanup EXIT

cd "$ROOT"

if ! npx supabase gen types typescript --project-id lsgppnhyuwcgnpylwepg > "$TMP"; then
  echo ""
  echo "❌ gen:types échoué — types/database.ts inchangé."
  echo "   Lance : npx supabase login"
  echo "   ou définis SUPABASE_ACCESS_TOKEN puis réessaie."
  exit 1
fi

if [ ! -s "$TMP" ]; then
  echo "❌ gen:types a produit un fichier vide — types/database.ts inchangé."
  exit 1
fi

mv "$TMP" "$OUT"
trap - EXIT
echo "✅ types/database.ts régénéré."
