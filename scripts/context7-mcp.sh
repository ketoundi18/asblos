#!/bin/bash
# Lance Context7 MCP (doc à jour des librairies). Clé API optionnelle via .env.local
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
# shellcheck source=/dev/null
source .env.local
set +a
if [[ -n "${CONTEXT7_API_KEY:-}" ]]; then
  exec npx -y @upstash/context7-mcp --api-key "$CONTEXT7_API_KEY"
fi
exec npx -y @upstash/context7-mcp
