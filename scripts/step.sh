#!/usr/bin/env bash
# just step N: open checkpoint N in a worktree of its own (main's folder is never touched), show what this step
# added since the one before, and run its beat. Prints the folder to cd into for `just up` at that checkpoint.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"; cd "$root"
n="${1:?usage: just step N   (0-8)}"; cp=$(printf 'cp-%02d' "$n"); prev=$(printf 'cp-%02d' $((n - 1)))
git rev-parse -q --verify "refs/tags/$cp" >/dev/null || { echo "no tag $cp"; exit 2; }
dir="${GH_STEPS:-$HOME/.cache/greenhouse-steps}/$cp"
if [ -d "$dir" ]; then git -C "$dir" checkout -q --detach -f "$cp"; git -C "$dir" clean -qfd -e node_modules -e .wrangler
else mkdir -p "$(dirname "$dir")"; git worktree add -q --detach "$dir" "$cp"; fi
echo "── $cp · $(git tag -l --format='%(contents:subject)' "$cp")"
if [ "$n" -gt 0 ]; then
  echo "   added since $prev:"; git diff --stat=100 "$prev" "$cp" -- . ':!**/bun.lock' ':!**/*.gen.ts' ':!**/worker-configuration.d.ts' ':!docs/architecture' | sed 's/^/   /'
fi
(cd "$dir" && bun install --frozen-lockfile >/dev/null 2>&1 && (cd skills/viz-explainer && bun install >/dev/null 2>&1); scripts/demo.sh "$cp")
echo "   folder: $dir"
