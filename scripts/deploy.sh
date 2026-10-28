#!/usr/bin/env bash
# just deploy: api first, then web, with wrangler. Refuses if a D1 migration is pending: migrations are applied by hand, never here.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"; cd "$root"
env_flag=(); [ -n "${1:-}" ] && [ "$1" != "prod" ] && env_flag=(--env "$1")
pending="$(cd apps/api && bunx wrangler d1 migrations list greenhouse --remote "${env_flag[@]}" 2>/dev/null | grep -cE '^\s*│?\s*[0-9]{4}_' || true)"
if [ "${pending:-0}" != "0" ]; then
  echo "✗ $pending D1 migration(s) pending on remote. Deploy stopped."
  echo "  Review them, then: cd apps/api && bunx wrangler d1 migrations apply greenhouse --remote"
  echo "  Migrations are additive; nothing is dropped or renamed in the same release as the code that stops using it."
  exit 1
fi
label="$(git describe --tags --always --dirty 2>/dev/null || echo unknown)"
echo "→ api ($label)"; (cd apps/api && bunx wrangler deploy "${env_flag[@]}" --var "GIT_DESCRIBE:$label" 2>&1 | grep -E "Deployed|Version ID|https://|Error" || true)
echo "→ web ($label)"; (cd apps/web && bun run build >/dev/null 2>&1 && bunx wrangler deploy "${env_flag[@]}" --var "GIT_DESCRIBE:$label" 2>&1 | grep -E "Deployed|Version ID|https://|Error" || true)
echo "→ smoke"; curl -sf --max-time 20 https://greenhouse-api.prthamesh-sarang.workers.dev/healthz | jq -c .version || echo "  (smoke skipped: api url differs from the default subdomain)"
echo "Next: flag on for yourself (GH_REMOTE=1 just flag user NAME you), use it, then widen. Rollback: GH_REMOTE=1 just flag off NAME, then wrangler rollback in apps/api or apps/web."
