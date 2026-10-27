#!/usr/bin/env bash
# Vendor third-party skills at the commits pinned in skills/manifest.json, then link every skill
# (ours in skills/<name>, vendored in skills/vendor/<name>) into .claude/skills and .pi/skills.
# Idempotent: a vendored skill whose .source already matches the pinned sha is left alone.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
manifest="$root/skills/manifest.json"
vendor="$root/skills/vendor"
mkdir -p "$vendor" "$root/.claude/skills" "$root/.pi/skills"
command -v jq >/dev/null || { echo "jq is required"; exit 2; }

changed=0
while IFS=$'\t' read -r repo ref name path; do
  dest="$vendor/$name"
  if [ -f "$dest/.source" ] && grep -q "$ref" "$dest/.source"; then continue; fi
  tmp="$(mktemp -d)"
  echo "↓ $name  ←  $repo@${ref:0:7}:$path"
  curl -fsSL "https://codeload.github.com/$repo/tar.gz/$ref" | tar -xz -C "$tmp" --strip-components=1 "$(basename "$repo")-$ref/$path" 2>/dev/null \
    || { echo "  ✗ could not extract $path from $repo@$ref"; rm -rf "$tmp"; exit 1; }
  rm -rf "$dest"; mkdir -p "$dest"
  cp -R "$tmp/$path/." "$dest/"
  printf 'repo=%s\nref=%s\npath=%s\nvendored=%s\n' "$repo" "$ref" "$path" "$(date -u +%FT%TZ)" > "$dest/.source"
  rm -rf "$tmp"; changed=$((changed+1))
done < <(jq -r '.vendor[] | .repo as $r | .ref as $s | .paths | to_entries[] | [$r, $s, .key, .value] | @tsv' "$manifest")

# link ours and vendored into both harnesses; remove dangling links first
for agentdir in "$root/.claude/skills" "$root/.pi/skills"; do
  find "$agentdir" -maxdepth 1 -type l ! -exec test -e {} \; -delete
  for d in "$root"/skills/*/ "$vendor"/*/; do
    n="$(basename "$d")"; [ "$n" = "vendor" ] && continue
    [ -f "$d/SKILL.md" ] || continue
    rel="$(python3 -c "import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))" "$d" "$agentdir")"
    ln -sfn "$rel" "$agentdir/$n"
  done
done
ours=$(ls -d "$root"/skills/*/SKILL.md 2>/dev/null | wc -l | tr -d ' ')
vend=$(ls -d "$vendor"/*/SKILL.md 2>/dev/null | wc -l | tr -d ' ')
echo "✓ skills: $ours ours, $vend vendored ($changed fetched), linked into .claude/skills and .pi/skills"
