#!/usr/bin/env bash
# The unit and story tests, wherever they exist at this stage: engine, domain, schema, agent, API. A folder with no
# test files is skipped; with none at all (the first stages), there is nothing to run yet.
set -euo pipefail
cd "$(dirname "$0")/.."
dirs=()
for d in packages/engine packages/domain packages/schema packages/agent/test apps/api/test; do
  [ -d "$d" ] && [ -n "$(find "$d" -name '*.test.ts' -not -path '*/node_modules/*' -print -quit)" ] && dirs+=("$d")
done
[ ${#dirs[@]} -gt 0 ] || { echo "no tests yet"; exit 0; }
exec bun test "${dirs[@]}" "$@"
