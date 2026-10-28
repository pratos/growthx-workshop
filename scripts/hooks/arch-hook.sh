#!/usr/bin/env bash
# Claude Code PostToolUse hook (Edit|Write|MultiEdit). Keeps docs/architecture/index.html in step with docs/ARCHITECTURE.md,
# and stops the agent when a new app or package lands without a place on the map.
# Exit 2 sends stderr back to the agent so it fixes the doc; exit 0 stays quiet.
set -uo pipefail
root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
file="$(jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)"
[ -n "$file" ] || exit 0
rel="${file#"$root"/}"
case "$rel" in
  docs/ARCHITECTURE.md)
    out="$(cd "$root" && bun scripts/arch.ts 2>&1)" || { echo "$out" >&2; exit 2; }
    echo "architecture map rebuilt: docs/architecture/index.html" ;;
  apps/*/package.json|packages/*/package.json|apps/*/wrangler.jsonc)
    out="$(cd "$root" && bun scripts/arch.ts --coverage 2>&1)" || { echo "$out" >&2; exit 2; } ;;
esac
exit 0
