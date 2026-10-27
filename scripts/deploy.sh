#!/usr/bin/env bash
# just deploy [stage]: api first, then web, through Alchemy. Refuses if a D1 migration is pending; migrations are a separate, manual step.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"; cd "$root"
stage="${1:-prod}"
pending="$(cd apps/api && bunx wrangler d1 migrations list greenhouse --remote 2>/dev/null | grep -cE '^\s*│?\s*[0-9]{4}_' || true)"
if [ "${pending:-0}" != "0" ]; then
  echo "✗ $pending D1 migration(s) pending on remote. Deploy stopped."
  echo "  Review them, then run: cd apps/api && bunx wrangler d1 migrations apply greenhouse --remote"
  echo "  Migrations are additive; nothing is dropped or renamed in the same release as the code that stops using it."
  exit 1
fi
echo "→ deploying stage=$stage: api, then web"
bun infra/alchemy.run.ts --stage "$stage"
api_url="$(cat .alchemy/last-api-url 2>/dev/null || true)"
[ -n "$api_url" ] && { echo "→ smoke: $api_url/healthz"; curl -sf "$api_url/healthz" | jq -c . ; }
echo "Next: flag on for yourself (just flag user NAME you), run the Stagehand flow, then widen. Rollback: just flag off NAME, then wrangler versions rollback."
