#!/usr/bin/env bash
# Print a plan's event stream as a story, from the running local api (just up) or a URL in GH_API.
set -euo pipefail
plan="${1:?usage: replay.sh <planId>}"; api="${GH_API:-http://localhost:8787}"
curl -sf "$api/plans/$plan/events" | jq -r '.[] | "\(.version | tostring | .[0:3] | . + "   "[length:])\(.type | . + "                  "[length:])\(.data.threadId // "") \(if .data.blockId then "on " + .data.blockId else "" end) by \(.by)\(if .data.body then ": \"" + .data.body + "\"" elif .data.decision then ": \"" + .data.decision + "\"" else "" end)"'
