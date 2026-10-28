#!/usr/bin/env bash
# just step N: open checkpoint N in a worktree of its own (main's folder is never touched), show what this step
# added since the one before, and run its beat. Prints the folder to cd into for `just up` at that checkpoint.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"; cd "$root"
n="${1:?usage: just step N   (0-10)}"; cp=$(printf 'cp-%02d' "$n"); prev=$(printf 'cp-%02d' $((n - 1)))
# Each checkpoint is a branch named cp-NN-<what it adds>, local or on origin; the tag cp-NN points at the same commit.
ref="$(git for-each-ref --format='%(refname:short)' "refs/heads/$cp-*" | head -1)"
[ -n "$ref" ] || ref="$(git for-each-ref --format='%(refname:short)' "refs/remotes/origin/$cp-*" | head -1)"
[ -n "$ref" ] || { git rev-parse -q --verify "refs/tags/$cp" >/dev/null && ref="$cp"; }
[ -n "$ref" ] || { echo "no branch or tag for $cp (git fetch origin?)"; exit 2; }
prevref="$(git for-each-ref --format='%(refname:short)' "refs/heads/$prev-*" "refs/remotes/origin/$prev-*" | head -1)"
[ "$n" -gt 0 ] || prevref="$(git for-each-ref --format='%(refname:short)' refs/heads/stack-base refs/remotes/origin/stack-base | head -1)"
[ -n "$prevref" ] || prevref="$prev"
dir="${GH_STEPS:-$HOME/.cache/greenhouse-steps}/$cp"
if [ -d "$dir" ]; then git -C "$dir" checkout -q --detach -f "$ref"; git -C "$dir" clean -qfd -e node_modules -e .wrangler
else mkdir -p "$(dirname "$dir")"; git worktree add -q --detach "$dir" "$ref"; fi
echo "── $ref · $(git log -1 --format=%s "$ref")"
if [ -n "$prevref" ] && git rev-parse -q --verify "$prevref" >/dev/null; then
  echo "   added since $prevref:"; git diff --stat=100 "$prevref" "$ref" -- . ':!**/bun.lock' ':!**/*.gen.ts' ':!**/worker-configuration.d.ts' ':!docs/architecture' | sed 's/^/   /'
fi
# What `just install` does on a fresh clone. Vendored skills come from main's copy, so no step downloads them again.
[ -d skills/vendor ] && mkdir -p "$dir/skills/vendor" && rsync -a skills/vendor/ "$dir/skills/vendor/"
(cd "$dir" && scripts/skills-sync.sh >/dev/null && bun install --frozen-lockfile >/dev/null 2>&1 && (cd skills/viz-explainer && bun install >/dev/null 2>&1); scripts/demo.sh "$cp")
echo "   folder: $dir"
