#!/usr/bin/env bash
# just user-add EMAIL NAME [admin|member]   (local D1 unless GH_REMOTE=1)
# Opens the account through the engine (AccountOpened plus the accounts row), so it is recorded exactly like a sign-up.
# Asks for the password without echoing it; only its hash reaches D1. The participant id is the part of the email before @.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
email="${1:?usage: just user-add EMAIL NAME [admin|member]}"; name="${2:?usage: just user-add EMAIL NAME [admin|member]}"; role="${3:-member}"
case "$role" in admin|member) ;; *) echo "role must be admin or member"; exit 2 ;; esac
read -rsp "password for $email: " pw; echo
[ ${#pw} -ge 12 ] || { echo "use at least 12 characters"; exit 2; }
tmp="$(mktemp -t gh-account.XXXXXX).sql"; trap 'rm -f "$tmp"' EXIT
printf '%s' "$pw" | bun "$root/packages/db/add-account.ts" "$email" "$name" "$role" > "$tmp"; unset pw
remote="--local"; [ "${GH_REMOTE:-}" = "1" ] && remote="--remote"
# GH_ENV=demo with GH_REMOTE=1 targets the demo site's database (greenhouse-demo.tarp.sh); otherwise the finished site's.
[ "${GH_ENV:-}" = "demo" ] && remote="$remote --env demo"
cd "$root/apps/api"
if bunx wrangler d1 execute DB $remote --file "$tmp" >/dev/null 2>"$tmp.err"; then echo "✓ $email opened as $role ($remote)"
elif grep -q UNIQUE "$tmp.err"; then echo "✗ $email already has an account ($remote)"; rm -f "$tmp.err"; exit 1
else cat "$tmp.err"; rm -f "$tmp.err"; exit 1; fi
rm -f "$tmp.err"
