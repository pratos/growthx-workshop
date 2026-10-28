#!/usr/bin/env bash
# Print a plan's event stream as a story, from the running local app (just up; its /api) or an API URL in GH_API.
set -euo pipefail
plan="${1:?usage: replay.sh <planId>}"; api="${GH_API:-http://localhost:3000/api}"
# Plan rooms are for signed-in participants: sign in as the local admin from .dev.vars.example (or GH_TOKEN).
v() { grep "^$1=" "$(dirname "$0")/../.dev.vars.example" | cut -d= -f2-; }
token="${GH_TOKEN:-$(curl -sf -H 'content-type: application/json' -d "{\"email\":\"$(v ADMIN_EMAIL)\",\"password\":\"$(v ADMIN_PASSWORD)\"}" "$api/auth/sign-in" | jq -r .token)}"
curl -sf -H "authorization: Bearer $token" "$api/plans/$plan/events" | jq -r '.[] | "\(.version | tostring | .[0:3] | . + "   "[length:])\(.type | . + "                  "[length:])\(.data.threadId // "") \(if .data.blockId then "on " + .data.blockId else "" end) by \(.by)\(if .data.body then ": \"" + .data.body + "\"" elif .data.decision then ": \"" + .data.decision + "\"" else "" end)"'
