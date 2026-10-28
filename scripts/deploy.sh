#!/usr/bin/env bash
# just deploy: api first, then web, with wrangler. Refuses if a D1 migration is pending: migrations are applied by hand,
# never here. Any failure stops the deploy with a non-zero exit, so CI and a person see the same result.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"; cd "$root"
env_flag=(); [ -n "${1:-}" ] && [ "$1" != "prod" ] && env_flag=(--env "$1")
subdomain="${WORKERS_SUBDOMAIN:-prthamesh-sarang}"

# Pending migrations. If wrangler cannot even list them (credentials, network), stop: unknown is not "none".
if ! list="$(cd apps/api && bunx wrangler d1 migrations list greenhouse --remote "${env_flag[@]}" 2>&1)"; then
  echo "✗ could not list remote D1 migrations; deploy stopped:"; echo "$list" | tail -5; exit 1
fi
pending="$(grep -cE '^\s*│?\s*[0-9]{4}_' <<<"$list" || true)"
if [ "${pending:-0}" != "0" ]; then
  echo "✗ $pending D1 migration(s) pending on remote. Deploy stopped."
  grep -E '[0-9]{4}_' <<<"$list" | sed 's/^/  /'
  echo "  Review them, then apply by hand: just migrate-remote (or the 'migrate' workflow on GitHub). Deploy never migrates."
  exit 1
fi

label="$(git describe --tags --always --dirty 2>/dev/null || echo unknown)"
deploy() { # $1 app dir; prints the lines that matter, keeps wrangler's exit status
  local out; if ! out="$(cd "apps/$1" && bunx wrangler deploy "${env_flag[@]}" --var "GIT_DESCRIBE:$label" 2>&1)"; then
    echo "✗ $1 deploy failed:"; echo "$out" | tail -15; exit 1
  fi
  grep -E "Deployed|Version ID|https://" <<<"$out" | sed 's/^/  /' || true
}
echo "→ api ($label)"; deploy api
echo "→ web ($label)"; (cd apps/web && bun run build >/dev/null) || { echo "✗ web build failed"; exit 1; }; deploy web
echo "→ smoke"
curl -sf --max-time 20 "https://greenhouse-api.$subdomain.workers.dev/healthz" | jq -e -c '.ok and .version' \
  || { echo "✗ smoke failed: https://greenhouse-api.$subdomain.workers.dev/healthz (set WORKERS_SUBDOMAIN if yours differs)"; exit 1; }
echo "Next: flag on for yourself (GH_REMOTE=1 just flag user NAME you), use it, then widen. Rollback: GH_REMOTE=1 just flag off NAME, then just rollback api|web <version-id>."
