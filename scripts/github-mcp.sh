#!/bin/bash
# Lance le serveur GitHub MCP en chargeant le token depuis .env.local
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
# shellcheck source=/dev/null
source .env.local
set +a
exec npx -y @modelcontextprotocol/server-github
