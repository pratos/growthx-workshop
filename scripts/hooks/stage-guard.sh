#!/usr/bin/env bash
# Claude Code PreToolUse hook (Edit|Write|MultiEdit): on a workshop branch (.stage exists), refuse an edit to a file the
# stage's plan does not list. Exit 2 sends the reason back to the agent. Off where there is no .stage.
set -uo pipefail
root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
[ -f "$root/.stage" ] || exit 0
file="$(jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)"
[ -n "$file" ] || exit 0
cd "$root" && exec bun scripts/stage.ts guard "$file"
