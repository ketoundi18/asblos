#!/bin/bash
# Serveur de dev AsblOS — redémarrage auto + nettoyage cache si crash
# Usage : npm run dev:clean  (Ctrl+C pour arrêter)

set -u
cd "$(dirname "$0")/.."

PORT=3000
MAX_RESTARTS=100
RESTART_DELAY=2
LOCK_FILE=".next/.dev-server.lock"

kill_port() {
  local port=$1
  for _ in 1 2 3; do
    local pids
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      kill -9 $pids 2>/dev/null || true
      sleep 0.5
    else
      break
    fi
  done
}

clean_cache() {
  echo "→ Nettoyage du cache .next..."
  rm -rf .next
  mkdir -p .next
}

echo "→ Arrêt des anciens serveurs sur les ports 3000 et 3001..."
kill_port 3000
kill_port 3001

if lsof -ti :3000 >/dev/null 2>&1; then
  echo "❌ Le port 3000 est encore occupé. Ferme les autres Terminals puis relance."
  exit 1
fi

clean_cache

echo ""
echo "→ Mode stable : redémarrage automatique si le serveur plante"
echo "  URL : http://localhost:${PORT}"
echo "  ⚠️  Un seul Terminal. Ne lance pas 'npm run dev' ailleurs."
echo "  ⚠️  N'exécute pas 'npm run build' pendant que le serveur tourne."
echo "  ⚠️  Après un gros changement : Cmd+Shift+R dans le navigateur."
echo "  (Ctrl+C pour arrêter définitivement.)"
echo ""

attempt=0

while [ "$attempt" -lt "$MAX_RESTARTS" ]; do
  attempt=$((attempt + 1))
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "→ Démarrage #${attempt} — $(date '+%H:%M:%S')"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  mkdir -p .next
  echo "$$" > "$LOCK_FILE"

  set +e
  npx next dev --port "$PORT"
  exit_code=$?
  set -e

  rm -f "$LOCK_FILE"

  # Arrêt volontaire (Ctrl+C) → code 130 ou 0
  if [ "$exit_code" -eq 0 ] || [ "$exit_code" -eq 130 ]; then
    echo ""
    echo "✓ Serveur arrêté."
    exit 0
  fi

  echo ""
  echo "⚠️  Le serveur s'est arrêté (code ${exit_code})."
  echo "→ Réparation : nettoyage cache + redémarrage dans ${RESTART_DELAY}s..."
  sleep "$RESTART_DELAY"

  kill_port 3000
  clean_cache
done

echo "❌ Trop de redémarrages (${MAX_RESTARTS}). Vérifie les erreurs dans le code."
exit 1
