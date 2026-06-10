#!/bin/bash
# Vérifie que layout.css se charge en dev (évite la page « sans style »).
set -euo pipefail

BASE="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"
PAGE="${1:-/connexion}"

if ! HTML=$(curl -sf "${BASE}${PAGE}" 2>/dev/null); then
  echo "❌ Serveur dev inaccessible sur ${BASE}"
  echo "   → npm run dev:clean"
  exit 1
fi

CSS=$(echo "$HTML" | grep -oE 'href="(/_next/static/css/[^"]+)"' | head -1 | sed 's/href="//;s/"//')

if [ -z "$CSS" ]; then
  echo "❌ Aucun fichier CSS trouvé dans ${PAGE}"
  exit 1
fi

read -r STATUS SIZE <<< "$(curl -s -o /dev/null -w "%{http_code} %{size_download}" "${BASE}${CSS}")"

if [ "$STATUS" != "200" ] || [ "$SIZE" -lt 10000 ]; then
  echo "❌ CSS KO : ${CSS} → HTTP ${STATUS}, ${SIZE} octets"
  echo "   → npm run dev:stop && rm -rf .next && npm run dev:clean"
  exit 1
fi

echo "✅ CSS OK : HTTP ${STATUS}, ${SIZE} octets (${CSS})"
