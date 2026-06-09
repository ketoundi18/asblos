#!/bin/bash
# Serveur de dev AsblOS — redémarrage auto + nettoyage cache si crash
# Usage : npm run dev:clean  (Ctrl+C pour arrêter)

set -u
cd "$(dirname "$0")/.."
# shellcheck source=scripts/lib/port-utils.sh
source scripts/lib/port-utils.sh

MAX_RESTARTS=100
RESTART_DELAY=2
# Hors de .next : clean_cache ne doit pas effacer le verrou (sinon 2 Terminals possibles)
DEV_LOCK=".asblos-dev.lock"
NEXT_BIN="./node_modules/.bin/next"

clean_cache() {
  echo "→ Nettoyage du cache .next..."
  rm -rf .next
  mkdir -p .next
}

release_locks() {
  rm -f "$DEV_LOCK"
}

acquire_dev_lock() {
  if [ -f "$DEV_LOCK" ]; then
    local old_pid
    old_pid=$(cat "$DEV_LOCK" 2>/dev/null || true)
    if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
      echo ""
      echo "❌ Un serveur dev tourne déjà (Terminal PID ${old_pid})."
      echo "   → Utilise ce Terminal, ou arrête-le avec Ctrl+C"
      echo "   → Sinon : npm run dev:stop"
      exit 1
    fi
    rm -f "$DEV_LOCK"
  fi
  echo $$ > "$DEV_LOCK"
}

wait_for_port() {
  local port=$1
  local max_wait=${2:-15}
  local i=0
  while [ "$i" -lt "$max_wait" ]; do
    if port_is_listening "$port"; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  return 1
}

trap 'release_locks; free_port "${PORT:-3000}" 2>/dev/null || true; exit 0' INT TERM
trap 'release_locks' EXIT

if [ ! -x "$NEXT_BIN" ]; then
  echo "❌ Next.js introuvable. Lance d'abord : npm install"
  exit 1
fi

acquire_dev_lock

echo "→ Préparation du serveur..."
stop_all_dev_servers
stop_next_orphans
sleep 0.5

PORT=$(pick_dev_port) || {
  echo ""
  echo "❌ Aucun port disponible (3000 et 3001 occupés)."
  show_port_process 3000
  show_port_process 3001
  echo ""
  echo "   Ferme les autres Terminals, puis : npm run dev:stop"
  exit 1
}

clean_cache

echo ""
echo "→ Mode stable : redémarrage automatique si le serveur plante"
echo "  URL : http://localhost:${PORT}"
if [ "$PORT" != "3000" ]; then
  echo "  (Le port 3000 était occupé — utilise bien le port ${PORT})"
fi
echo "  ⚠️  Un seul Terminal. Ne lance pas 'npm run dev' ailleurs."
echo "  ⚠️  N'exécute pas 'npm run build' pendant que le serveur tourne."
echo "  ⚠️  Après un gros changement : Cmd+Shift+R dans le navigateur."
echo "  (Ctrl+C pour arrêter définitivement.)"
echo ""

attempt=0

while [ "$attempt" -lt "$MAX_RESTARTS" ]; do
  attempt=$((attempt + 1))
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "→ Démarrage #${attempt} — $(date '+%H:%M:%S') — port ${PORT}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if [ "$attempt" -gt 1 ]; then
    free_port "$PORT" || true
  fi

  start_ts=$(date +%s)

  set +e
  "$NEXT_BIN" dev --port "$PORT"
  exit_code=$?
  set -e

  end_ts=$(date +%s)
  duration=$((end_ts - start_ts))

  if [ "$exit_code" -eq 130 ]; then
    echo ""
    echo "→ Arrêt en cours..."
    free_port "$PORT" || true
    echo "✓ Serveur arrêté."
    exit 0
  fi

  # Next.js 15 quitte parfois le parent avant que le port écoute — attendre un peu.
  if ! port_is_listening "$PORT"; then
    wait_for_port "$PORT" 15 || true
  fi

  if port_is_listening "$PORT"; then
    if [ "$duration" -lt 8 ]; then
      echo ""
      echo "✓ Serveur prêt sur http://localhost:${PORT}"
      echo "  (Ctrl+C dans ce Terminal pour arrêter)"
    fi
    while port_is_listening "$PORT"; do
      sleep 2
    done
    echo ""
    echo "✓ Serveur arrêté."
    exit 0
  fi

  if [ "$exit_code" -eq 0 ] && [ "$duration" -ge 8 ]; then
    echo ""
    echo "✓ Serveur arrêté."
    exit 0
  fi

  echo ""
  if [ "$exit_code" -eq 137 ] || [ "$exit_code" -eq 143 ]; then
    echo "⚠️  Le serveur a été interrompu brutalement — nouvelle tentative dans ${RESTART_DELAY}s..."
  elif [ "$duration" -lt 8 ]; then
    echo "⚠️  Démarrage raté (code ${exit_code}) — nouvelle tentative dans ${RESTART_DELAY}s..."
  else
    echo "⚠️  Le serveur s'est arrêté (code ${exit_code})."
    echo "→ Réparation dans ${RESTART_DELAY}s..."
  fi

  sleep "$RESTART_DELAY"

  # Ne pas effacer .next à chaque essai : Next.js 15 se détache souvent avec code 0.
  if [ "$exit_code" -ne 0 ] || [ "$duration" -ge 8 ]; then
    clean_cache
  fi
done

echo "❌ Trop de redémarrages (${MAX_RESTARTS})."
exit 1
