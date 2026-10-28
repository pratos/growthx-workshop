#!/usr/bin/env bash
# just deploy [prod|demo]: api first, then web, with wrangler. Refuses if a D1 migration is pending: migrations are applied
# by hand, never here. Any failure stops the deploy with a non-zero exit, so CI and a person see the same result.
#   prod  the finished site, greenhouse.tarp.sh: deployed by hand from the last stage (cp-10)
#   demo  the workshop's demo site, greenhouse-demo.tarp.sh: GitHub Actions deploys main here on every merge
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"; cd "$root"
target="${1:-prod}"
case "$target" in prod) env_flag=(); site="greenhouse.tarp.sh" ;; demo) env_flag=(--env demo); site="greenhouse-demo.tarp.sh" ;; *) echo "usage: deploy.sh prod|demo"; exit 2 ;; esac
echo "→ deploying to $site ($target)"
# The security and spending audit is not optional: a failing check stops the deploy.
bun scripts/cf-audit.ts | grep -E "^✗|fix:|failed|pass" || true
bun scripts/cf-audit.ts >/dev/null || { echo "✗ cf-audit failed: deploy stopped (just cf-audit for the details)"; exit 1; }

# Pending migrations. If wrangler cannot even list them (credentials, network), stop: unknown is not "none".
bash scripts/cf-account.sh
if ! list="$(cd apps/api && bunx wrangler d1 migrations list DB --remote "${env_flag[@]}" 2>&1)"; then
  echo "✗ could not list remote D1 migrations; deploy stopped:"; echo "$list" | tail -5; exit 1
fi
pending="$(grep -cE '^\s*│?\s*[0-9]{4}_' <<<"$list" || true)"
if [ "${pending:-0}" != "0" ]; then
  echo "✗ $pending D1 migration(s) pending on remote. Deploy stopped."
  grep -E '[0-9]{4}_' <<<"$list" | sed 's/^/  /'
  echo "  Review them, then apply by hand: just migrate-remote $target (or the 'migrate' workflow on GitHub for demo). Deploy never migrates."
  exit 1
fi

label="$(git describe --tags --always --dirty 2>/dev/null || echo unknown)"
deploy() { # $1 app dir, $2.. extra wrangler flags; prints the lines that matter, keeps wrangler's exit status
  local app="$1"; shift
  local out; if ! out="$(cd "apps/$app" && bunx wrangler deploy "$@" --var "GIT_DESCRIBE:$label" 2>&1)"; then
    echo "✗ $app deploy failed:"; echo "$out" | tail -15; exit 1
  fi
  grep -E "Deployed|Version ID|https://" <<<"$out" | sed 's/^/  /' || true
}
echo "→ api ($label)"; deploy api "${env_flag[@]}"
# The web Worker is built by the Cloudflare Vite plugin, which picks the environment at build time (CLOUDFLARE_ENV); the
# built output then carries it, so the deploy itself takes no --env.
echo "→ web ($label)"; (cd apps/web && CLOUDFLARE_ENV="${env_flag[1]:-}" bun run build >/dev/null) || { echo "✗ web build failed"; exit 1; }; deploy web
echo "→ smoke: https://$site/healthz"
for _ in 1 2 3 4 5 6; do curl -sf --max-time 20 "https://$site/healthz" | jq -e -c '.ok and .api.version' && break; sleep 5; done \
  || { echo "✗ smoke failed: https://$site/healthz (a new custom domain can take a minute; run it again)"; exit 1; }
echo "Next: flag on for yourself (GH_REMOTE=1 just flag user NAME you), use it, then widen. Rollback: GH_REMOTE=1 just flag off NAME, then just rollback api|web <version-id>."
