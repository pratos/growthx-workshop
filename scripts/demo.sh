#!/usr/bin/env bash
# One deterministic beat per checkpoint. Exit 0 means the checkpoint's promise holds. Run it inside that checkpoint:
# `just step N` does, in a worktree of its own. Order: the parts every product needs first, then the plan, then the build.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"; cd "$root"
cp="${1:?usage: demo.sh cp-NN}"
pass() { echo "✓ $cp: $1"; }
fail() { echo "✗ $cp: $1"; exit 1; }

# A real api on a private port with its own local state: migrated, seeded through the engine, stopped on exit.
api=""
api_up() {
  export WRANGLER_SEND_METRICS=false
  (cd apps/api && bunx wrangler d1 migrations apply greenhouse --local --persist-to .wrangler/demo >/dev/null 2>&1)
  mkdir -p apps/api/.wrangler && bun packages/db/seed.ts > apps/api/.wrangler/demo-seed.sql
  (cd apps/api && bunx wrangler d1 execute greenhouse --local --persist-to .wrangler/demo --file .wrangler/demo-seed.sql >/dev/null 2>&1)
  (cd apps/api && exec bunx wrangler dev --port 8799 --persist-to .wrangler/demo >/tmp/gh-demo-api.log 2>&1) & api=$!
  trap 'pkill -f "wrangler dev --port 8799" >/dev/null 2>&1 || true' EXIT
  for _ in $(seq 1 60); do curl -sf localhost:8799/healthz >/dev/null 2>&1 && return; sleep 0.5; done
  fail "the api did not start (see /tmp/gh-demo-api.log)"
}
login() { curl -sf -H 'content-type: application/json' -d "{\"email\":\"$1\",\"password\":\"$2\"}" localhost:8799/auth/sign-in | jq -r .token; }
local_login() { local k="$1"; grep "^${k}_" .dev.vars.example | sed 's/^[^=]*=//' | tr '\n' ' '; }

case "$cp" in
  cp-00)
    bun test packages/engine packages/domain/src/account >/dev/null 2>&1 || fail "engine or sign-up/sign-in stories fail"
    skills/agent-ready/scripts/check.sh --quiet >/dev/null || fail "agent-ready has gaps: just agent-ready"
    api_up
    curl -sf localhost:8799/readyz | jq -e '.ok' >/dev/null || fail "/readyz is not ok"
    read -r ae ap <<<"$(local_login ADMIN)"; t=$(login "$ae" "$ap")
    [ "$(curl -s -o /dev/null -w '%{http_code}' localhost:8799/flags)" = 401 ] || fail "/flags answers without a sign-in"
    curl -sf -H "authorization: Bearer $t" localhost:8799/flags >/dev/null || fail "the seeded admin cannot read /flags"
    pass "out of the blocks: health, readiness, the seeded admin signs in and reaches the admin API; sign-up and sign-in stories pass; agent-ready has no gaps" ;;
  cp-01)
    bun skills/viz-explainer/scripts/build.mjs docs/decisions/agent-loop.spec.json docs/decisions/agent-loop.html >/dev/null || fail "decision report does not build"
    for f in docs/plans/*.plan.json; do bun skills/create-plan/scripts/build.mjs "$f" >/dev/null || fail "$f does not build"; done
    pass "the product is planned: \"where should the agent's work run?\" and the plans build, every step validated" ;;
  cp-02)
    skills/ddd-vocabulary/scripts/check-domain-vocabulary.sh docs/DOMAIN-VOCABULARY.md packages apps >/dev/null || fail "domain vocabulary check fails"
    bun test packages/domain/src/thread packages/domain/src/session >/dev/null 2>&1 || fail "Thread or Session expect tests fail"
    if git show-ref --quiet refs/heads/wrong/cp-02; then
      tmp=$(mktemp -d); git worktree add -q --detach "$tmp" wrong/cp-02
      if (cd "$tmp" && skills/ddd-vocabulary/scripts/check-domain-vocabulary.sh docs/DOMAIN-VOCABULARY.md packages apps >/dev/null 2>&1); then git worktree remove --force "$tmp"; fail "wrong/cp-02 should fail the domain vocabulary check"; fi
      git worktree remove --force "$tmp"
    fi
    pass "named and modelled: every command and event is in the vocabulary, Thread and Session stories pass, and wrong/cp-02 (ThreadClosed) fails the check" ;;
  cp-03) bun test packages/domain/src/upcast >/dev/null 2>&1 && pass "a recorded v1 DecisionRecorded reads as v2; nothing on disk changes" || fail "upcast test fails" ;;
  cp-04)
    bun test apps/api/test >/dev/null 2>&1 || fail "api tests fail"
    api_up
    read -r ue up <<<"$(local_login USER)"; read -r ge gp <<<"$(local_login AGENT)"; ts=$(login "$ue" "$up"); ta=$(login "$ge" "$gp")
    s=$(curl -sf -H 'content-type: application/json' -H "authorization: Bearer $ts" -d '{"type":"StartSession","data":{"title":"demo"}}' localhost:8799/plans/demo/sessions | jq -r '.events[0].data.sessionId')
    r=$(curl -sf -H 'content-type: application/json' -H "authorization: Bearer $ts" -d "{\"type\":\"Ask\",\"data\":{\"sessionId\":\"$s\",\"asked\":\"ready?\"}}" localhost:8799/plans/demo/sessions | jq -r '.events[0].data.runId')
    curl -sf -H 'content-type: application/json' -H "authorization: Bearer $ta" -d "{\"type\":\"StartRun\",\"data\":{\"sessionId\":\"$s\",\"runId\":\"$r\"}}" localhost:8799/plans/demo/sessions >/dev/null || fail "the agent cannot start the run"
    curl -sf -H "authorization: Bearer $ts" "localhost:8799/plans/demo/sessions/$s" | jq -e '.runs[0].status == "running"' >/dev/null || fail "the session view does not show the run"
    pass "the plan room: a signed-in person starts a session and asks, the agent signs in and starts the run, the view shows it running" ;;
  cp-05)
    test -f "apps/web/src/routes/plans.\$planId.tsx" && grep -q agentation apps/web/src/components/DevTools.tsx || fail "plan page or Agentation toolbar missing"
    api_up
    out=$(timeout 20 bun scripts/ws-check.ts http://localhost:8799 2>&1) && grep -q ThreadOpened <<<"$out" || fail "the socket heard nothing: $out"
    pass "the screen, live: the plan page and Agentation exist, and a socket on the plan room hears an append ($out)" ;;
  cp-06)
    test -f packages/agent/README.md && (cd packages/agent && bunx tsc --noEmit -p . >/dev/null 2>&1) || fail "packages/agent does not typecheck"
    pass "the durable agent builds; kill -9 and resume live with just agent-demo (needs a model key)" ;;
  cp-07)
    p=$(HEAD_REF=wrong/cp-02 scripts/review.sh cp-02 --prompt 2>/dev/null) || fail "review cannot build its prompt"
    grep -q "Not: resolution, verdict" <<<"$p" && grep -q "ThreadClosed" <<<"$p" || fail "the reviewer would not see both the vocabulary and the ThreadClosed diff"
    pass "just review sends a different model the domain vocabulary first, then the planted branch's diff with ThreadClosed; recorded answer: demo/review-fallback.md" ;;
  cp-08)
    grep -q 'data-flag-off="resolve-thread"' "apps/web/src/routes/plans.\$planId.tsx" || fail "the plan page does not gate Resolve on its flag"
    api_up
    curl -sf localhost:8799/participants/admin/flags | jq -e '.on | index("resolve-thread")' >/dev/null || fail "resolve-thread should be on for admin (seeded allowlist)"
    curl -sf localhost:8799/participants/sam/flags | jq -e '.on | index("resolve-thread") | not' >/dev/null || fail "resolve-thread should be off for sam"
    live="https://greenhouse-api.prthamesh-sarang.workers.dev"
    v=$(curl -sf --max-time 20 "$live/healthz" | jq -r '"\(.version.label) (\(.version.id))"') || v="unreachable"
    pass "released behind a flag: Resolve shows only where resolve-thread is on (admin yes, sam no); flip it with just flag, no deploy. Live api: $v" ;;
  *) echo "unknown checkpoint $cp"; exit 2 ;;
esac
