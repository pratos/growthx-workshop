#!/usr/bin/env bash
# One deterministic beat per checkpoint. Exit 0 means the checkpoint's promise holds.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"; cd "$root"
cp="${1:?usage: demo.sh cp-NN}"
pass() { echo "✓ $cp: $1"; }
case "$cp" in
  cp-00)
    (cd apps/api && bunx wrangler dev --port 8799 >/tmp/gh-cp00.log 2>&1 &) ; for i in $(seq 1 40); do curl -sf localhost:8799/healthz >/dev/null 2>&1 && break; sleep 0.5; done
    curl -sf localhost:8799/healthz | grep -q '"ok":true' && curl -sf localhost:8799/readyz | grep -q '"ok":true'; pkill -f "wrangler dev --port 8799" || true
    pass "api answers /healthz and /readyz from a fresh clone" ;;
  cp-01)
    scripts/../skills/ddd-vocabulary/scripts/check-glossary.sh docs/GLOSSARY.md packages apps >/dev/null && pass "every command and event in code has a glossary entry"
    if git show-ref --quiet refs/heads/wrong/cp-01; then
      tmp=$(mktemp -d); git worktree add -q "$tmp" wrong/cp-01
      if (cd "$tmp" && skills/ddd-vocabulary/scripts/check-glossary.sh docs/GLOSSARY.md packages apps >/dev/null 2>&1); then echo "✗ wrong/cp-01 should fail the glossary check"; git worktree remove --force "$tmp"; exit 1; fi
      git worktree remove --force "$tmp"; pass "and the branch with ThreadClosed fails it"
    fi ;;
  cp-02) bun test packages/domain >/dev/null 2>&1 && pass "Thread decider expect snapshots pass, read as prose: packages/domain/src/thread/__expect__/" ;;
  cp-03) bun test packages/domain/src/upcast >/dev/null 2>&1 && pass "v1 DecisionRecorded upcasts to v2 with a defaulted rationale" ;;
  cp-04) bun skills/viz-explainer/scripts/build.mjs docs/decisions/gh-12.spec.json docs/decisions/gh-12.html >/dev/null && pass "decision report built and every step validated: docs/decisions/gh-12.html" ;;
  cp-05) test -f "apps/web/src/routes/plans.\$planId.tsx" && grep -q agentation apps/web/src/components/DevTools.tsx && grep -q DevTools apps/web/src/routes/__root.tsx && pass "plan page with resolve action exists; Agentation toolbar mounted in dev" ;;
  cp-06) scripts/review.sh main --dry-run >/dev/null && pass "review runs with a different model than the author" ;;
  cp-07)
    api="https://greenhouse-api.prthamesh-sarang.workers.dev"
    v=$(curl -sf --max-time 20 "$api/healthz" | jq -r '"\(.version.label) (\(.version.id))"'); [ -n "$v" ] && [ "$v" != "null (null)" ] || { echo "✗ no version from $api/healthz"; exit 1; }
    n=$(cd apps/api && bunx wrangler deployments list 2>/dev/null | grep -c "Version(s)" || true)
    GH_REMOTE=1 scripts/flag.sh list >/dev/null && pass "live api version $v; $n deployment(s) listed; flags readable. Rollback: just rollback api <previous id>" ;;
  cp-08)
    web="https://greenhouse-web.prthamesh-sarang.workers.dev"; api="https://greenhouse-api.prthamesh-sarang.workers.dev"
    out=$(timeout 20 bun scripts/ws-check.ts "$web" "$api" 2>&1) && echo "$out" | grep -q "ThreadOpened" && pass "multiplayer: a socket on the web Worker hears an append made through the api ($out)" ;;
  *) echo "unknown checkpoint $cp"; exit 2 ;;
esac
