#!/bin/bash
# Lance UN SEUL serveur AsblOS (évite les conflits CSS)

set -e
cd "$(dirname "$0")/.."

echo "→ Arrêt des anciens serveurs sur les ports 3000 et 3001..."
for port in 3000 3001; do
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill -9 $pids 2>/dev/null || true
    echo "  Port $port libéré"
  fi
done

echo "→ Nettoyage du cache .next..."
rm -rf .next

echo "→ Démarrage sur http://localhost:3000"
echo "  (Laisse ce Terminal ouvert. Ctrl+C pour arrêter.)"
echo ""

exec npx next dev --port 3000
