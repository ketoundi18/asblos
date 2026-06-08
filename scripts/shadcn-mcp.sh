#!/bin/bash
# Lance shadcn MCP depuis la racine AsblOS (lit components.json)
set -euo pipefail
cd "$(dirname "$0")/.."
exec npx -y shadcn@latest mcp
