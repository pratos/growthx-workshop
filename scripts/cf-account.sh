#!/usr/bin/env bash
# Stops a Cloudflare command run as the wrong account. The account is pinned in apps/api/wrangler.jsonc, but a pin only
# makes a wrong login fail later with "not authorized" (code 7403). This says why, and how to fix it, before anything runs.
# Locally: wrangler must be logged in to that account here (a wrangler profile is bound per folder, so a checkout or
# worktree outside the repo uses the default login). In CI: CLOUDFLARE_ACCOUNT_ID must be the same account.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
pin() { grep -oE '"account_id": *"[0-9a-f]{32}"' "$root/apps/$1/wrangler.jsonc" 2>/dev/null | grep -oE '[0-9a-f]{32}' || true; }
want="$(pin api)"
[ -n "$want" ] || { echo "✗ no account_id in apps/api/wrangler.jsonc: pin the account that owns the zone and the databases"; exit 1; }
web="$(pin web)"
[ -z "$web" ] || [ "$web" = "$want" ] || { echo "✗ apps/web and apps/api pin different accounts ($web, $want)"; exit 1; }
if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  [ "${CLOUDFLARE_ACCOUNT_ID:-$want}" = "$want" ] || { echo "✗ CLOUDFLARE_ACCOUNT_ID is not the account pinned in apps/api/wrangler.jsonc ($want)"; exit 1; }
  exit 0
fi
who="$(cd "$root/apps/api" && bunx wrangler whoami 2>&1 | sed 's/\x1b\[[0-9;]*m//g')"
grep -q "$want" <<<"$who" && exit 0
email="$(grep -oE 'associated with the email [^ ]+' <<<"$who" | awk '{print $NF}' | sed 's/\.$//' || true)"
profile="$(grep -oE 'Active profile: [^ ]+' <<<"$who" | awk '{print $NF}' || true)"
echo "✗ wrangler here is logged in as ${email:-nobody}${profile:+ (profile $profile)}, which cannot reach account $want, pinned in apps/api/wrangler.jsonc."
echo "    fix: in this folder, bunx wrangler profile use <the profile for that account> (or bunx wrangler login with it);"
echo "         a worktree outside the repo does not inherit the repo's profile: put it under the repo, e.g. git worktree add .deploy/<name>"
exit 1
