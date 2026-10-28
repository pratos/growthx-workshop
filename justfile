# The only commands anyone, or any agent, needs. Quiet on success.

set shell := ["bash", "-euo", "pipefail", "-c"]

default:
    @just --list

# Vendor pinned third-party skills and link all skills into .claude and .pi
skills:
    @scripts/skills-sync.sh

# Install everything (bun workspaces + skill builder + git hooks)
install: skills
    bun install
    @cd skills/viz-explainer && bun install >/dev/null
    @git config core.hooksPath scripts/git-hooks

# Run api and web locally; D1 and the Durable Object run in miniflare. http://localhost:3000, api on the API binding
up: install migrate-local seed
    cd apps/web && bun run dev

# Expect tests (ms), then api tests
test:
    scripts/test.sh

# Lint and typecheck: oxlint (type-aware, repo config), tsc. `just fmt` formats; the format check is not enforced yet.
lint:
    bunx oxlint -c .oxlintrc.json --type-aware --tsconfig apps/api/tsconfig.json --disable-nested-config apps packages
    bunx tsc -p apps/api/tsconfig.json --noEmit

# Apply pending D1 migrations locally (never runs on deploy)
migrate-local:
    @[ -d apps/api/migrations ] || { echo "no migrations yet"; exit 0; }; cd apps/api && bunx wrangler d1 migrations apply greenhouse --local >/dev/null

# Seed the local D1 through the engine: an admin, Sam and the agent (logins in .dev.vars.example), flags default off
seed:
    @[ -f packages/db/seed.ts ] || { echo "nothing to seed yet"; exit 0; }; \
    mkdir -p apps/api/.wrangler && bun packages/db/seed.ts > apps/api/.wrangler/seed.sql && \
    cd apps/api && bunx wrangler d1 execute greenhouse --local --file .wrangler/seed.sql >/dev/null

# Reset local state (D1 + Durable Objects), then migrate and seed again
reset:
    rm -rf apps/api/.wrangler/state apps/web/.wrangler/state
    just migrate-local seed

# Rebuild the architecture map from docs/ARCHITECTURE.md (a hook does this on every edit)
arch:
    bun scripts/arch.ts

# Fail if the map is stale or a folder under apps/ or packages/ is not on it
arch-check:
    bun scripts/arch.ts --coverage
    bun scripts/arch.ts --check

# Build a plan page from its JSON and record the change as a version: just plan docs/plans/x.plan.json "why this change"
# (a hook does this on every agent edit, with the session and prompt; from pi: PLAN_VIA=pi PLAN_SESSION=<id> just plan …)
plan file intent="":
    PLAN_INTENT="{{intent}}" bun skills/create-plan/scripts/build.mjs {{file}}

# Every version of a plan: who, through what, why, what changed
plan-history file:
    @bun skills/create-plan/scripts/history.mjs list {{file}}

# Rebuild one version of a plan to look at, without recording anything: just plan-at docs/plans/x.plan.json v3
plan-at file v:
    @out="$(mktemp -d)/$(basename {{file}} .plan.json)-{{v}}.plan.json"; bun skills/create-plan/scripts/history.mjs at {{file}} {{v}} > "$out" && PLAN_NO_RECORD=1 bun skills/create-plan/scripts/build.mjs "$out" "${out%.plan.json}.plan.html" >/dev/null 2>&1 && echo "${out%.plan.json}.plan.html"

# What changed between two versions of a plan, in words: just plan-diff docs/plans/x.plan.json v2 v5
plan-diff file a b:
    @bun skills/create-plan/scripts/history.mjs diff {{file}} {{a}} {{b}}

# List plans, newest first, with status and progress
plans:
    @for f in $(ls -t docs/plans/*.plan.json 2>/dev/null); do jq -r --arg f "$f" '[.status, .title, ([.phases[].verify | (.automated + .manual)[] | select(.done)] | length | tostring) + "/" + ([.phases[].verify | (.automated + .manual)[]] | length | tostring), $f] | @tsv' "$f"; done

# Build a viz-explainer artifact: just artifact spec.json docs/decisions/x.html
artifact spec out:
    bun skills/viz-explainer/scripts/build.mjs {{spec}} {{out}}

# Can an agent clone, run, seed, log into, administer and browse this repo alone? ✓/✗ per item with the fix
agent-ready:
    skills/agent-ready/scripts/check.sh

# Score prose for slop: rules first, then Jev if a key is present
slop file:
    uvx --from slop-guard==0.5.0 sg -v --counts {{file}}
    @if [ -f .dev.vars ]; then set -a; . ./.dev.vars; set +a; fi; \
    if [ -n "${TYPESAFE_API_KEY:-}" ]; then [ -x tools/slop-jev/slop-jev ] || bun build --compile --minify tools/slop-jev/src/main.ts --outfile tools/slop-jev/slop-jev >/dev/null; tools/slop-jev/slop-jev {{file}}; \
    else echo "(jev layer skipped: just secret put TYPESAFE_API_KEY)"; fi

# Store a secret in .dev.vars without echoing it: just secret put NAME
secret action name:
    @[ "{{action}}" = "put" ] || { echo "usage: just secret put NAME"; exit 2; }
    @read -rs -p "{{name}}: " v; echo; [ -n "$v" ] || { echo "empty, nothing written"; exit 1; }; \
    touch .dev.vars; grep -v "^{{name}}=" .dev.vars > .dev.vars.tmp || true; printf '%s=%s\n' "{{name}}" "$v" >> .dev.vars.tmp; mv .dev.vars.tmp .dev.vars; chmod 600 .dev.vars; echo "{{name}} stored in .dev.vars"

# Run one checkpoint's deterministic beat in this folder: just demo cp-03
demo cp:
    @scripts/demo.sh {{cp}}

# Open checkpoint N in its own worktree, show what it added since N-1, run its beat: just step 3
step n:
    @scripts/step.sh {{n}}
