#!/bin/bash
# Arrête proprement le serveur de dev AsblOS
set -u
cd "$(dirname "$0")/.."
# shellcheck source=scripts/lib/port-utils.sh
source scripts/lib/port-utils.sh

echo "→ Arrêt du serveur AsblOS..."

DEV_LOCK=".asblos-dev.lock"
if [ -f "$DEV_LOCK" ]; then
  lock_pid=$(cat "$DEV_LOCK" 2>/dev/null || true)
  if [ -n "$lock_pid" ] && kill -0 "$lock_pid" 2>/dev/null; then
    echo "→ Arrêt du script dev (PID ${lock_pid})..."
    kill "$lock_pid" 2>/dev/null || true
    sleep 1
    kill -9 "$lock_pid" 2>/dev/null || true
  fi
fi

stop_all_dev_servers
stop_next_orphans
rm -f "$DEV_LOCK"

sleep 0.5

if port_is_listening 3000 || port_is_listening 3001; then
  echo ""
  echo "❌ Impossible de libérer le port 3000 (ou 3001)."
  show_port_process 3000
  show_port_process 3001
  echo ""
  echo "   → Ferme les autres Terminals Cursor qui tournent npm run dev"
  echo "   → Ou tue le processus ci-dessus manuellement"
  echo "   → Puis relance : npm run dev:clean"
  exit 1
fi

echo "✓ Ports libres. Lance : npm run dev:clean"
