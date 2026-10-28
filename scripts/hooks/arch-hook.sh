#!/usr/bin/env bash
# Claude Code PostToolUse hook (Edit|Write|MultiEdit). Keeps the built pages in step with their sources:
#   docs/ARCHITECTURE.md → docs/architecture/index.html; any *.plan.json → its .plan.html, and a new version in its
#   .plan.versions.jsonl with this session, its transcript and the prompt behind the edit.
# Stops the agent when a new app or package lands without a place on the map, or a plan breaks a plan rule.
# Exit 2 sends stderr back to the agent so it fixes the doc; exit 0 stays quiet.
set -uo pipefail
root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
input="$(cat)"
file="$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<<"$input" 2>/dev/null)"
[ -n "$file" ] || exit 0
rel="${file#"$root"/}"
case "$rel" in
  docs/ARCHITECTURE.md)
    out="$(cd "$root" && bun scripts/arch.ts 2>&1)" || { echo "$out" >&2; exit 2; }
    echo "architecture map rebuilt: docs/architecture/index.html" ;;
  *.plan.json)
    # An agent edit is a plan version: record the session and transcript, so the version carries the prompt that asked for it.
    session="$(jq -r '.session_id // empty' <<<"$input")"; transcript="$(jq -r '.transcript_path // empty' <<<"$input")"
    out="$(cd "$root" && PLAN_VIA=claude-code PLAN_SESSION="$session" PLAN_TRANSCRIPT="$transcript" bun skills/create-plan/scripts/build.mjs "$rel" 2>&1)" || { echo "$out" >&2; exit 2; }
    echo "$out" | tail -1 ;;
  apps/*/package.json|packages/*/package.json|apps/*/wrangler.jsonc)
    out="$(cd "$root" && bun scripts/arch.ts --coverage 2>&1)" || { echo "$out" >&2; exit 2; } ;;
esac
exit 0
