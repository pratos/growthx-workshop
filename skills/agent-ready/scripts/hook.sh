#!/usr/bin/env bash
# Claude Code hook for the agent-ready checklist. Never blocks; it tells the agent what is still missing.
#   hook.sh session  (SessionStart)  print the open gaps once, as context for the session
#   hook.sh post     (PostToolUse on Edit|Write|MultiEdit) re-check when a file the checklist reads changes
set -uo pipefail
root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../../.." && pwd)}"
check="$(dirname "$0")/check.sh"
case "${1:-}" in
  session)
    gaps="$(CLAUDE_PROJECT_DIR="$root" "$check" --quiet 2>/dev/null)"
    [ -n "$gaps" ] && printf 'agent-ready gaps (skills/agent-ready, just agent-ready):\n%s\n' "$gaps"
    exit 0 ;;
  post)
    file="$(jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)"
    [ -n "$file" ] || exit 0
    rel="${file#"$root"/}"
    case "$rel" in
      .gitignore|flake.nix|flake.lock|justfile|agent-ready.json|.dev.vars.example|.env.example|*seed*|*wrangler.jsonc|*wrangler.toml|fly.toml|*Dockerfile|*compose*.yml|package.json|*/package.json|pyproject.toml|.mcp.json) ;;
      *) exit 0 ;;
    esac
    gaps="$(CLAUDE_PROJECT_DIR="$root" "$check" --quiet 2>/dev/null)"
    [ -n "$gaps" ] || exit 0
    jq -n --arg c "agent-ready after editing $rel:
$gaps" '{hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $c}}'
    exit 0 ;;
  *) echo "usage: hook.sh session|post" >&2; exit 2 ;;
esac
