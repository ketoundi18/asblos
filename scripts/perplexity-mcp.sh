#!/bin/bash
# Lance le serveur Perplexity MCP en chargeant la clé API depuis .env.local
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
# shellcheck source=/dev/null
source .env.local
set +a
exec npx -yq @perplexity-ai/mcp-server
