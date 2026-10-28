#!/usr/bin/env bash
# just flag on NAME | off NAME | user NAME participant | pct NAME 25   (local D1 unless GH_REMOTE=1)
set -euo pipefail
cd "$(dirname "$0")/../apps/api"
action="${1:?}"; name="${2:-}"; arg="${3:-}"
[ "$action" = list ] || [ -n "$name" ] || { echo "usage: just flag on|off|user|pct NAME [arg]"; exit 2; }
remote=""; [ "${GH_REMOTE:-}" = "1" ] && remote="--remote" || remote="--local"
# GH_ENV=demo with GH_REMOTE=1 targets the demo site's database (greenhouse-demo.tarp.sh); otherwise the finished site's.
[ "${GH_ENV:-}" = "demo" ] && remote="$remote --env demo"
case "$action" in
  on)   sql="INSERT INTO flags (name, enabled) VALUES ('$name', 1) ON CONFLICT(name) DO UPDATE SET enabled=1" ;;
  off)  sql="INSERT INTO flags (name, enabled, allowlist, percent) VALUES ('$name', 0, NULL, 0) ON CONFLICT(name) DO UPDATE SET enabled=0, allowlist=NULL, percent=0" ;;
  user) sql="INSERT INTO flags (name, enabled, allowlist) VALUES ('$name', 0, '$arg') ON CONFLICT(name) DO UPDATE SET allowlist=COALESCE(allowlist || ',', '') || '$arg'" ;;
  pct)  sql="INSERT INTO flags (name, enabled, percent) VALUES ('$name', 0, $arg) ON CONFLICT(name) DO UPDATE SET percent=$arg" ;;
  list) sql="SELECT name, enabled, allowlist, percent FROM flags" ;;
  *) echo "usage: flag.sh on|off|user|pct|list NAME [arg]"; exit 2 ;;
esac
bunx wrangler d1 execute DB $remote --command "$sql" --json | jq -r '.[0].results[]? | "\(.name)\t\(.enabled)\t\(.allowlist // "-")\t\(.percent)%"' 2>/dev/null || true
[ "$action" = list ] || echo "flag $name: $action ${arg:-} ($remote)"
