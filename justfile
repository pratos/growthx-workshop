# The only commands anyone, or any agent, needs. Quiet on success.

set shell := ["bash", "-euo", "pipefail", "-c"]

default:
    @just --list

# Vendor pinned third-party skills and link all skills into .claude and .pi
skills:
    @scripts/skills-sync.sh

# Install everything (bun workspaces + skill builder)
install: skills
    bun install
    @cd skills/viz-explainer && bun install >/dev/null

# Run api and web locally; D1 and the Durable Object run in miniflare. http://localhost:3000, api on the API binding
up: install migrate-local seed
    cd apps/web && bun run dev

# The anonymous check-in Worker (growthx-eng.tarp.sh): just checkin dev | just checkin deploy
checkin action:
    cd apps/checkin && bunx wrangler {{action}}

# Expect tests (ms), then api tests
test:
    bun test packages/domain packages/schema apps/api/test

# Lint and typecheck: oxlint (type-aware, repo config), tsc. `just fmt` formats; the format check is not enforced yet.
lint:
    bunx oxlint -c .oxlintrc.json --type-aware --tsconfig apps/api/tsconfig.json --disable-nested-config apps packages
    bunx tsc -p apps/api/tsconfig.json --noEmit

# Apply pending D1 migrations locally (never runs on deploy)
migrate-local:
    cd apps/api && bunx wrangler d1 migrations apply greenhouse --local >/dev/null

# Seed the local D1: admin and a random user, flags default off
seed:
    cd apps/api && bunx wrangler d1 execute greenhouse --local --file ../../packages/db/seed.sql >/dev/null

# Reset local state (D1 + Durable Objects), then migrate and seed again
reset:
    rm -rf apps/api/.wrangler/state apps/web/.wrangler/state
    just migrate-local seed

# Flags: just flag list | on NAME | off NAME | user NAME participant | pct NAME 25. GH_REMOTE=1 for prod.
flag action name="" id="":
    @scripts/flag.sh {{action}} {{name}} {{id}}

# Replay a plan's stream from the local DO and print it as a story
replay plan:
    @scripts/replay.sh {{plan}}

# Scaffold: just new command Name | just new event Name
new kind name:
    @scripts/new.sh {{kind}} {{name}}

# Paste into the root justfile. Not wired in automatically; the root justfile is not edited by this package.

# Durable agent demo: one input, a slow tool; kill -9 it mid-tool, run again, it resumes (packages/agent/README.md)
agent-demo:
    cd packages/agent && bun run demo

# Second terminal: print each entry the agent demo commits to agent.sqlite as it lands
agent-watch:
    cd packages/agent && bun run watch

# Delete the agent demo's SQLite file so the next agent-demo starts from nothing
agent-reset:
    cd packages/agent && bun run reset

# Build a viz-explainer artifact: just artifact spec.json docs/decisions/x.html
artifact spec out:
    bun skills/viz-explainer/scripts/build.mjs {{spec}} {{out}}

# Fail if a command or event in code is missing from the glossary
glossary-check:
    skills/ddd-vocabulary/scripts/check-glossary.sh docs/GLOSSARY.md packages apps

# Score prose for slop: rules first, then Jev if a key is present
slop file:
    uvx --from slop-guard==0.5.0 sg -v --counts {{file}}
    @if [ -f .dev.vars ]; then set -a; . ./.dev.vars; set +a; fi; \
    if [ -n "${TYPESAFE_API_KEY:-}" ]; then [ -x tools/slop-jev/slop-jev ] || bun build --compile --minify tools/slop-jev/src/main.ts --outfile tools/slop-jev/slop-jev >/dev/null; tools/slop-jev/slop-jev {{file}}; \
    else echo "(jev layer skipped: just secret put TYPESAFE_API_KEY)"; fi

# Review the current branch with a different model than the one that authored it
review base="main":
    @scripts/review.sh {{base}}

# Store a secret in .dev.vars without echoing it: just secret put NAME
secret action name:
    @[ "{{action}}" = "put" ] || { echo "usage: just secret put NAME"; exit 2; }
    @read -rs -p "{{name}}: " v; echo; [ -n "$v" ] || { echo "empty, nothing written"; exit 1; }; \
    touch .dev.vars; grep -v "^{{name}}=" .dev.vars > .dev.vars.tmp || true; printf '%s=%s\n' "{{name}}" "$v" >> .dev.vars.tmp; mv .dev.vars.tmp .dev.vars; chmod 600 .dev.vars; echo "{{name}} stored in .dev.vars"

# Deploy api then web with wrangler. Stops if a D1 migration is pending. `just deploy staging` uses the wrangler env of that name.
deploy env="prod":
    @scripts/deploy.sh {{env}}

# Roll a Worker back to its previous version: just rollback api | web [version-id]
rollback app version="":
    cd apps/{{app}} && bunx wrangler rollback {{version}}

# Serve the deck from the repo root so its diagram links resolve: http://localhost:8777/deck/
deck:
    python3 -m http.server 8777 --bind 127.0.0.1

# Run one checkpoint's deterministic beat: just demo cp-02
demo cp:
    @scripts/demo.sh {{cp}}
