#!/usr/bin/env bash
# Print your last N typed prompts to coding agents, newest last. Reads only local history files; sends nothing anywhere.
#   usage: last-asks.sh [N=10] [--here]     --here keeps only prompts typed in the current directory (Claude Code only)
# Sources: Claude Code ~/.claude/history.jsonl, Codex ~/.codex/history.jsonl. Skips slash commands and prompts under 15 characters.
set -uo pipefail
n="${1:-10}"; here=""; [ "${2:-}" = "--here" ] || [ "${1:-}" = "--here" ] && here="$PWD"; [[ "$n" =~ ^[0-9]+$ ]] || n=10
command -v jq >/dev/null || { echo "needs jq" >&2; exit 2; }
{
  [ -f "$HOME/.claude/history.jsonl" ] && jq -r --arg here "$here" '
    select(($here == "") or (.project == $here)) | select(.display != null)
    | [(.timestamp / 1000 | floor), "claude", (.display | gsub("[\n\t]+"; " "))] | @tsv' "$HOME/.claude/history.jsonl" 2>/dev/null
  [ -z "$here" ] && [ -f "$HOME/.codex/history.jsonl" ] && jq -r '
    select(.text != null) | [.ts, "codex", (.text | gsub("[\n\t]+"; " "))] | @tsv' "$HOME/.codex/history.jsonl" 2>/dev/null
} | awk -F'\t' 'substr($3,1,1) != "/" && length($3) >= 15' | sort -n -k1,1 | tail -n "$n" \
  | awk -F'\t' '{ t=$3; if (length(t) > 300) t = substr(t, 1, 300) "…"; printf "%2d. [%s] %s\n", NR, $2, t }'
