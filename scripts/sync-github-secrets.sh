#!/bin/bash
# Copie les secrets CI depuis .env.local vers GitHub Actions (1 commande).
set -euo pipefail

cd "$(dirname "$0")/.."
ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Fichier $ENV_FILE introuvable."
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "❌ GitHub CLI (gh) manquant. Installe-le : brew install gh && gh auth login"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "❌ Pas connecté à GitHub. Lance : gh auth login"
  exit 1
fi

get_var() {
  local key="$1"
  local val
  val=$(grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r')
  if [ -z "$val" ]; then
    echo "❌ Variable manquante dans $ENV_FILE : $key"
    exit 1
  fi
  printf '%s' "$val"
}

KEYS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  E2E_PARENT_EMAIL
  E2E_PARENT_PASSWORD
  E2E_STAFF_EMAIL
  E2E_STAFF_PASSWORD
)

echo "→ Envoi de ${#KEYS[@]} secrets vers GitHub Actions…"
for key in "${KEYS[@]}"; do
  gh secret set "$key" --body "$(get_var "$key")"
  echo "  ✓ $key"
done

echo ""
echo "✅ Terminé. Relance la CI : https://github.com/ketoundi18/asblos/actions"
