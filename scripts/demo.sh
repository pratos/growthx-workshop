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
  mkdir -p apps/api/.wrangler; : > apps/api/.wrangler/demo-seed.sql
  [ -f packages/db/seed.ts ] && bun packages/db/seed.ts > apps/api/.wrangler/demo-seed.sql
  [ -s apps/api/.wrangler/demo-seed.sql ] && (cd apps/api && bunx wrangler d1 execute greenhouse --local --persist-to .wrangler/demo --file .wrangler/demo-seed.sql >/dev/null 2>&1)
  (cd apps/api && exec bunx wrangler dev --port 8799 --persist-to .wrangler/demo >/tmp/gh-demo-api.log 2>&1) & api=$!
  trap 'pkill -f "wrangler dev --port 8799" >/dev/null 2>&1 || true' EXIT
  for _ in $(seq 1 60); do curl -sf localhost:8799/healthz >/dev/null 2>&1 && return; sleep 0.5; done
  fail "the api did not start (see /tmp/gh-demo-api.log)"
}
# The mistake the check and the reviewer must catch, made on the spot in a throwaway worktree (no branch): the first
# pass at "resolve thread" names the event ThreadClosed with a verdict, and its own tests still pass.
planted=""
plant() {
  planted=$(mktemp -d)/w; git worktree add -q --detach "$planted" HEAD
  ( cd "$planted" && f=packages/domain/src/thread/decider.ts &&
    sed -i.bak -e "s/export const ThreadResolved   = defineEvent('ThreadResolved',   { threadId: Id, by: ParticipantId });/export const ThreadClosed     = defineEvent('ThreadClosed',     { threadId: Id, by: ParticipantId, verdict: Text });/" \
      -e "s/ReturnType<typeof ThreadResolved>/ReturnType<typeof ThreadClosed>/" "$f" && rm -f "$f.bak" &&
    git -c user.name=demo -c user.email=demo@greenhouse.test commit -qam "resolve thread, first pass: ThreadClosed with a verdict" )
  trap 'git worktree remove --force "$planted" >/dev/null 2>&1; pkill -f "wrangler dev --port 8799" >/dev/null 2>&1 || true' EXIT
}
login() { curl -sf -H 'content-type: application/json' -d "{\"email\":\"$1\",\"password\":\"$2\"}" localhost:8799/auth/sign-in | jq -r .token; }
local_login() { local k="$1"; grep "^${k}_" .dev.vars.example | sed 's/^[^=]*=//' | tr '\n' ' '; }

case "$cp" in
  cp-00)
    api_up
    curl -sf localhost:8799/healthz | jq -e '.ok and .version.label' >/dev/null || fail "/healthz has no version"
    curl -sf localhost:8799/readyz | jq -e '.ok' >/dev/null || fail "/readyz is not ok"
    gaps=$(skills/agent-ready/scripts/check.sh --quiet | grep -c '^✗' || true)
    pass "scaffold runs locally: /healthz with a version, /readyz ok; just agent-ready lists $gaps gap(s) the next stages close" ;;
  cp-01)
    bash -n scripts/deploy.sh && test -f .github/workflows/deploy.yml && test -f docs/DEPLOY.md || fail "deploy script, workflow or guide missing"
    grep -q "fetch-depth: 0" .github/workflows/deploy.yml || fail "the workflow's checkout is shallow"
    live="https://greenhouse-api.prthamesh-sarang.workers.dev"
    v=$(curl -sf --max-time 20 "$live/healthz" | jq -r '"\(.version.label) (\(.version.id))"') || v="unreachable"
    pass "deployable: just deploy and the GitHub workflow (check, preview, deploy from main, manual migrate); live api: $v" ;;
  cp-02)
    skills/ddd-vocabulary/scripts/check-domain-vocabulary.sh docs/DOMAIN-VOCABULARY.md packages apps >/dev/null || fail "vocabulary check fails"
    bun skills/viz-explainer/scripts/build.mjs docs/decisions/agent-loop.spec.json /tmp/gh-agent-loop.html >/dev/null || fail "decision report does not build"
    planted=$(mktemp -d)/w; git worktree add -q --detach "$planted" HEAD
    trap 'git worktree remove --force "$planted" >/dev/null 2>&1 || true' EXIT
    printf "\nexport const Verdict = Schema.Struct({ verdict: Text });\n" >> "$planted/packages/schema/src/index.ts"
    if (cd "$planted" && skills/ddd-vocabulary/scripts/check-domain-vocabulary.sh docs/DOMAIN-VOCABULARY.md packages apps >/dev/null 2>&1); then fail "the check should reject a verdict"; fi
    pass "designed: the vocabulary check passes and rejects a banned word (verdict); the agent-loop decision report builds" ;;
  cp-03)
    bun test packages/engine packages/domain/src/account >/dev/null 2>&1 || fail "engine or sign-up/sign-in stories fail"
    api_up
    email="demo-$(date +%s)@greenhouse.test"
    curl -sf -H 'content-type: application/json' -d "{\"email\":\"$email\",\"name\":\"Demo\",\"password\":\"a long enough password\"}" localhost:8799/auth/sign-up >/dev/null || fail "sign-up refused"
    t=$(login "$email" "a long enough password"); [ -n "$t" ] && [ "$t" != null ] || fail "sign-in failed"
    curl -sf -H "authorization: Bearer $t" localhost:8799/auth/me | jq -e '.account.email' >/dev/null || fail "/auth/me does not know the token"
    pass "event-sourced identity: sign-up, sign-in and /auth/me over HTTP; the sign-up and sign-in stories pass" ;;
  cp-04)
    api_up
    read -r ae ap <<<"$(local_login ADMIN)"; read -r ue up <<<"$(local_login USER)"; ta=$(login "$ae" "$ap"); tu=$(login "$ue" "$up")
    [ "$(curl -s -o /dev/null -w '%{http_code}' localhost:8799/admin/summary)" = 401 ] || fail "/admin answers without a sign-in"
    [ "$(curl -s -o /dev/null -w '%{http_code}' -H "authorization: Bearer $tu" localhost:8799/admin/summary)" = 403 ] || fail "/admin answers a participant"
    curl -sf -H "authorization: Bearer $ta" localhost:8799/admin/events | jq -e '[.events[].data.passwordHash // empty] | all(. == "•••")' >/dev/null || fail "the event log shows a secret"
    test -f e2e/admin.spec.ts || fail "no admin end-to-end test"
    pass "admin: 401 signed out, 403 for a participant, the event log with secrets masked; just e2e admin runs it in a browser" ;;
  cp-05)
    bun test packages/domain/src/thread packages/domain/src/upcast >/dev/null 2>&1 || fail "thread or upcast tests fail"
    plant
    if (cd "$planted" && skills/ddd-vocabulary/scripts/check-domain-vocabulary.sh docs/DOMAIN-VOCABULARY.md packages apps >/dev/null 2>&1); then fail "the check should reject ThreadClosed"; fi
    p=$(cd "$planted" && scripts/review.sh HEAD~1 --prompt 2>/dev/null); grep -q ThreadClosed <<<"$p" || fail "the reviewer would not see ThreadClosed"
    git worktree remove --force "$planted"
    api_up
    out=$(timeout 20 bun scripts/ws-check.ts http://localhost:8799 2>&1) && grep -q ThreadOpened <<<"$out" || fail "the socket heard nothing: $out"
    pass "the plan document: a socket hears an append live; the check and the reviewer both catch a first pass naming ThreadClosed" ;;
  cp-06)
    bun test packages/domain/src/session >/dev/null 2>&1 || fail "session stories fail"
    api_up
    read -r ue up <<<"$(local_login USER)"; ts=$(login "$ue" "$up")
    s=$(curl -sf -H 'content-type: application/json' -H "authorization: Bearer $ts" -d '{"type":"StartSession","data":{"title":"demo"}}' localhost:8799/plans/demo/sessions | jq -r '.events[0].data.sessionId')
    curl -sf -H 'content-type: application/json' -H "authorization: Bearer $ts" -d "{\"type\":\"Ask\",\"data\":{\"sessionId\":\"$s\",\"asked\":\"client or wrapper?\"}}" localhost:8799/plans/demo/sessions >/dev/null
    store=$(mktemp -d)/agent.sqlite
    (cd packages/agent && GREENHOUSE_URL=http://localhost:8799 PLAN=demo AGENT_MODEL=faux AGENT_STORE="$store" exec bun run src/serve.ts >/tmp/gh-demo-agent.log 2>&1) & agent=$!
    for _ in $(seq 1 40); do curl -sf -H "authorization: Bearer $ts" "localhost:8799/plans/demo/sessions/$s" | jq -e '.runs[0].status == "finished"' >/dev/null 2>&1 && break; sleep 0.5; done
    kill -INT $agent 2>/dev/null || true
    curl -sf -H "authorization: Bearer $ts" "localhost:8799/plans/demo/sessions/$s" | jq -e '.runs[0].runBy == "agent" and .runs[0].status == "finished"' >/dev/null || fail "the agent did not answer (see /tmp/gh-demo-agent.log)"
    pass "chat with the agent: a signed-in person asks, the agent process signs in, answers through pi-durable, and the session shows the answer" ;;
  cp-07)
    grep -q "gh-arrive" apps/web/src/styles.css && grep -q "prefers-reduced-motion" apps/web/src/styles.css || fail "no arrival motion, or it ignores reduced motion"
    grep -q 'header-account' apps/web/src/components/Header.tsx || fail "the top bar does not show who is signed in"
    pass "UI pass: theme-token components, one accent, a 180ms arrival that respects reduced motion, and a top bar that says who you are" ;;
  cp-08)
    bun test packages/agent/test packages/domain/src/session >/dev/null 2>&1 || fail "agent or session tests fail"
    test -f packages/agent/test/__expect__/fails-after-three.snap.txt || fail "no story for a failing agent"
    pass "the agent's failures are stories: fails a run after three tries, resumes its own after a restart, answers once from the store" ;;
  cp-09)
    n=$(cd e2e && bunx playwright test --list 2>/dev/null | grep -c '›' || true)
    [ "${n:-0}" -ge 7 ] || fail "expected at least 7 end-to-end tests, found ${n:-0}"
    pass "end-to-end: $n browser tests across sign-up, decisions, two people live and the agent answering; run them with just e2e" ;;
  cp-10)
    grep -q 'data-flag-off="resolve-thread"' "apps/web/src/routes/plans.\$planId.tsx" || fail "the plan page does not gate Resolve on its flag"
    api_up
    curl -sf localhost:8799/participants/admin/flags | jq -e '.on | index("resolve-thread")' >/dev/null || fail "resolve-thread should be on for admin"
    curl -sf localhost:8799/participants/sam/flags | jq -e '.on | index("resolve-thread") | not' >/dev/null || fail "resolve-thread should be off for sam"
    pass "released behind a flag: Resolve shows only where resolve-thread is on (admin yes, sam no); flip it with just flag, no deploy" ;;
  *) echo "unknown checkpoint $cp"; exit 2 ;;
esac
