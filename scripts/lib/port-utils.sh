#!/bin/bash
# Utilitaires partagés — libération de ports (macOS)

port_is_listening() {
  lsof -tiTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

show_port_process() {
  local port=$1
  echo "   Processus sur le port ${port} :"
  lsof -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | tail -n +2 || echo "   (introuvable)"
}

free_port() {
  local port=$1
  local i

  for i in 1 2 3 4 5 6 7 8; do
    if ! port_is_listening "$port"; then
      return 0
    fi

    local pids
    pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
    if [ -n "$pids" ]; then
      # SIGTERM d'abord, puis SIGKILL si le port reste occupé
      kill $pids 2>/dev/null || true
      sleep 0.5
      if port_is_listening "$port"; then
        kill -9 $pids 2>/dev/null || true
      fi
    fi
    sleep 0.4
  done

  if port_is_listening "$port"; then
    return 1
  fi
  return 0
}

stop_all_dev_servers() {
  # Ne pas utiliser pkill : ça tue le mauvais processus (parent npx)
  # et laisse parfois un Node orphelin sur le port.
  free_port 3000 || true
  free_port 3001 || true
}

# Tue aussi les processus next dev restants (orphelins sans port)
stop_next_orphans() {
  local pids
  pids=$(pgrep -f '[n]ode.*next dev' 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "→ Arrêt des processus next dev orphelins..."
    kill $pids 2>/dev/null || true
    sleep 0.5
    kill -9 $pids 2>/dev/null || true
  fi
}

pick_dev_port() {
  if ! port_is_listening 3000; then
    echo 3000
    return 0
  fi

  echo "⚠️  Le port 3000 est occupé — libération..." >&2
  show_port_process 3000 >&2

  if free_port 3000; then
    echo 3000
    return 0
  fi

  echo "⚠️  Bascule sur le port 3001..." >&2
  if free_port 3001; then
    echo 3001
    return 0
  fi

  return 1
}
