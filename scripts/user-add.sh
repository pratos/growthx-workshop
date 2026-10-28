#!/usr/bin/env bash
# just user-add EMAIL NAME [admin|member]   (local D1 unless GH_REMOTE=1)
# Asks for the password without echoing it; only its hash reaches D1. The participant id is the part of the email before @.
set -euo pipefail
email="${1:?usage: just user-add EMAIL NAME [admin|member]}"; name="${2:?usage: just user-add EMAIL NAME [admin|member]}"; role="${3:-member}"
case "$role" in admin|member) ;; *) echo "role must be admin or member"; exit 2 ;; esac
[[ "$email" =~ ^[^@\ \']+@[^@\ \']+$ ]] || { echo "not an email: $email"; exit 2; }
[[ "$name" != *"'"* ]] || { echo "name cannot contain a quote"; exit 2; }
id="${email%@*}"; email="$(tr '[:upper:]' '[:lower:]' <<<"$email")"
read -rsp "password for $email: " pw; echo
[ ${#pw} -ge 12 ] || { echo "use at least 12 characters"; exit 2; }
hash="$(printf '%s' "$pw" | bun "$(dirname "$0")/../packages/db/hash-password.ts")"; unset pw
remote="--local"; [ "${GH_REMOTE:-}" = "1" ] && remote="--remote"
cd "$(dirname "$0")/../apps/api"
bunx wrangler d1 execute greenhouse $remote --command "INSERT INTO users (id, email, name, role, password_hash) VALUES ('$id', '$email', '$name', '$role', '$hash') ON CONFLICT(email) DO UPDATE SET name=excluded.name, role=excluded.role, password_hash=excluded.password_hash" >/dev/null
echo "✓ $email is a $role ($remote, participant id $id)"
