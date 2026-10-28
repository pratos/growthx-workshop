#!/usr/bin/env bash
# Model inversion: review the branch with a model other than the one that wrote it, domain vocabulary in context.
# Author with pi (grok) → review with Claude; author with Claude Code → review with pi. REVIEWER=claude|pi overrides.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"; cd "$root"
# --dry-run says how much would be reviewed; --prompt prints exactly what the reviewing model receives.
base="${1:-main}"; head="${HEAD_REF:-HEAD}"; dry=""; [ "${2:-}" = "--dry-run" ] && dry=1; show=""; [ "${2:-}" = "--prompt" ] && show=1
reviewer="${REVIEWER:-claude}"
diff="$(git diff "$base"..."$head" -- . ':!bun.lock' ':!**/*.snap.txt' 2>/dev/null || git diff "$base" "$head" -- . ':!bun.lock')"
[ -n "$diff" ] || { echo "no diff against $base"; exit 0; }
prompt="You are reviewing a branch of Greenhouse for understanding, not approval. Read docs/DOMAIN-VOCABULARY.md first: the words in it are the only words allowed for domain concepts; any identifier that is a synonym or a new noun is a defect even if every test passes. Then read the diff. Report: (1) vocabulary violations with file and line, (2) correct code that is wrong (contradicts the domain vocabulary, the event-sourcing rules, or an invariant), (3) at most two real bugs. Skip nitpicks. End with one question the author should answer before merge.

DOMAIN VOCABULARY:
$(cat docs/DOMAIN-VOCABULARY.md)

DIFF:
$diff"
[ -n "$show" ] && { echo "$prompt"; exit 0; }
[ -n "$dry" ] && { echo "would review $(echo "$diff" | wc -l | tr -d ' ') diff lines with $reviewer"; exit 0; }
case "$reviewer" in
  claude) claude -p "$prompt" --model opus ;;
  pi)     pi -p "$prompt" ;;
  *) echo "REVIEWER must be claude or pi"; exit 2 ;;
esac
