#!/bin/bash
# Empêche npm run build pendant que le serveur dev tourne (évite cache corrompu)
# En CI (GitHub Actions), cette vérification est ignorée.

set -e
cd "$(dirname "$0")/.."

if [ "${CI:-}" = "true" ] || [ "${GITHUB_ACTIONS:-}" = "true" ]; then
  exit 0
fi

LOCK_FILE=".next/.dev-server.lock"

if [ -f "$LOCK_FILE" ]; then
  pid=$(cat "$LOCK_FILE" 2>/dev/null || true)
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo ""
    echo "❌ BUILD BLOQUÉ : le serveur de dev tourne encore (pid ${pid})."
    echo ""
    echo "   1. Va dans le Terminal où tourne npm run dev:clean"
    echo "   2. Appuie sur Ctrl+C pour l'arrêter"
    echo "   3. Relance ensuite : npm run build"
    echo ""
    exit 1
  fi
  rm -f "$LOCK_FILE"
fi

if lsof -ti :3000 >/dev/null 2>&1; then
  echo ""
  echo "❌ BUILD BLOQUÉ : quelque chose écoute sur le port 3000."
  echo "   Arrête le serveur dev (Ctrl+C) avant de lancer npm run build."
  echo ""
  exit 1
fi

exit 0
