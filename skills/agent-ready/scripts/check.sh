#!/usr/bin/env bash
# agent-ready: can an agent clone this repo, run it, log in, seed it, administer it and drive it in a browser
# without a person? Each check is a file or a command, never a judgement call.
#   usage: check.sh [--quiet]     --quiet prints only failures
#   exit 0 when everything passes, 1 when anything fails.
# Overrides live in agent-ready.json at the repo root (all keys optional):
#   { "seed": ["packages/db/seed.sql"], "adminApi": ["/flags"], "loginApi": ["/api/auth"], "envExample": ".dev.vars.example" }
set -uo pipefail
root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$root" || exit 2
quiet=""; [ "${1:-}" = "--quiet" ] && quiet=1
fails=0
ok()   { [ -n "$quiet" ] || echo "✓ $1"; }
bad()  { echo "✗ $1 — fix: $2"; fails=$((fails + 1)); }
cfg()  { [ -f agent-ready.json ] && jq -r "$1 // empty" agent-ready.json 2>/dev/null; }
has()  { [ -n "$(find . -path ./node_modules -prune -o -path ./.git -prune -o -path ./repos -prune -o -path ./skills/vendor -prune -o -path '*/fixtures' -prune -o -path '*/__fixtures__' -prune -o \( "$@" \) -print -quit 2>/dev/null)" ]; }
src()  { find . -path ./node_modules -prune -o -path ./.git -prune -o -path ./repos -prune -o -path ./skills -prune -o -path '*/dist' -prune -o -path '*/node_modules' -prune -o -path ./deck -prune -o -path '*/fixtures' -prune -o -path '*/__fixtures__' -prune -o -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.py' -o -name '*.go' -o -name '*.rb' \) -print 2>/dev/null; }
ignored() { [ -f .gitignore ] && grep -qxF -e "$1" -e "$1/" -e "/$1" -e "/$1/" .gitignore; }
inflake() { [ -f flake.nix ] && grep -qE "(^|[^a-z_-])($1)([^a-z_-]|$)" flake.nix; }

# 1 · .gitignore covers every stack in the repo
need=()
has -name package.json && need+=(node_modules dist)
has \( -name 'wrangler.jsonc' -o -name 'wrangler.toml' \) && need+=(.wrangler '.dev.vars*')
has \( -name pyproject.toml -o -name 'requirements*.txt' -o -name uv.lock \) && need+=(.venv __pycache__ .pytest_cache)
has -name 'next.config.*' && need+=(.next)
has -name Cargo.toml && need+=(target)
has -name '.env' && need+=(.env)
miss=(); for p in "${need[@]}"; do ignored "$p" || miss+=("$p"); done
if [ ${#miss[@]} -eq 0 ]; then ok "gitignore: covers ${#need[@]} entries for the stacks found"
else bad "gitignore: missing ${miss[*]}" "add them to .gitignore (start from github.com/github/gitignore for each language and framework)"; fi

# 2 · one pinned dev shell, so nobody installs into their system
if [ ! -f flake.nix ]; then bad "flake: no flake.nix" "add a Nix flake with a devShell listing every tool; enter with nix develop or direnv's use flake"
elif [ ! -f flake.lock ]; then bad "flake: flake.nix has no flake.lock, so every clone resolves its own nixpkgs" "run nix flake lock and commit flake.lock"
else ok "flake: flake.nix and flake.lock"; fi
if has \( -name pyproject.toml -o -name 'requirements*.txt' -o -name uv.lock \); then
  if inflake 'uv'; then ok "python: uv comes from the flake"; else bad "python: Python files but no uv in flake.nix" "add uv to the devShell; run Python only as uv run, never pip into the system"; fi
fi

# 3 · the CLIs for every service the repo talks to are local and pinned
if has \( -name 'wrangler.jsonc' -o -name 'wrangler.toml' \); then
  if grep -q '"wrangler"' package.json apps/*/package.json 2>/dev/null || inflake 'wrangler'; then ok "cli: wrangler pinned"; else bad "cli: wrangler config but wrangler is not pinned" "add wrangler to devDependencies or the flake"; fi
fi
if has -name fly.toml; then inflake 'flyctl' && ok "cli: flyctl in the flake" || bad "cli: fly.toml but no flyctl in flake.nix" "add flyctl to the devShell"; fi
if has \( -name Dockerfile -o -name 'docker-compose*.yml' -o -name 'compose*.yml' \); then inflake 'docker|docker-client' && ok "cli: docker in the flake" || bad "cli: Dockerfile or compose file but no docker in flake.nix" "add docker-client (or docker) to the devShell"; fi
if src | xargs grep -lE "postgres(ql)?://|drizzle-orm/(pg|node-postgres|postgres-js)|from ['\"](pg|postgres)['\"]|psycopg" 2>/dev/null | grep -q .; then
  inflake 'postgresql(_[0-9]+)?' && ok "cli: psql (postgresql) in the flake" || bad "cli: Postgres in code but no postgresql in flake.nix" "add postgresql to the devShell so the agent has psql and a local server"
fi

# 4 · local data comes back with one command
recipes="$(just --summary 2>/dev/null || true)"
for r in up test seed reset; do
  grep -qw "$r" <<<"$recipes" && ok "just: '$r' recipe" || bad "just: no '$r' recipe" "add 'just $r' (reset = wipe local state, migrate, seed)"
done

# 5 · two seeded accounts the agent can log in as
seeds="$(cfg '.seed // [] | .[]')"
[ -n "$seeds" ] || seeds="$(find . -path ./node_modules -prune -o -path ./.git -prune -o -path ./repos -prune -o -path ./skills -prune -o -path '*/node_modules' -prune -o -type f -iname '*seed*' \( -name '*.sql' -o -name '*.ts' -o -name '*.js' -o -name '*.py' -o -name '*.json' \) -print 2>/dev/null)"
if [ -z "$seeds" ]; then bad "seed: no seed file" "add one (or list it under seed in agent-ready.json)"
else
  # shellcheck disable=SC2086
  if grep -qiE "insert into [\"'\`]?(users?|accounts?|members?|participants?)[\"'\` (]|create(Many)?User|signUp|users?\.(create|insert)" $seeds 2>/dev/null \
     && grep -qi 'admin' $seeds 2>/dev/null; then ok "seed: creates user accounts, including an admin"
  else bad "seed: no user accounts in $(echo $seeds | tr '\n' ' ')" "seed one admin and one regular user with known local-only passwords"; fi
fi
env_ex="$(cfg '.envExample')"; [ -n "$env_ex" ] || env_ex="$(ls .dev.vars.example .env.example 2>/dev/null | head -1)"
if [ -z "$env_ex" ] || [ ! -f "$env_ex" ]; then bad "env: no .dev.vars.example or .env.example" "commit one with every variable name and safe local values"
elif grep -qiE '^ADMIN_(EMAIL|USERNAME)=' "$env_ex" && grep -qiE '^ADMIN_PASSWORD=' "$env_ex" && grep -qiE '^USER_(EMAIL|USERNAME)=' "$env_ex" && grep -qiE '^USER_PASSWORD=' "$env_ex"; then
  ok "env: $env_ex names the admin and user test logins"
else bad "env: $env_ex lacks ADMIN_EMAIL/ADMIN_PASSWORD and USER_EMAIL/USER_PASSWORD" "add the seeded test logins (local values only) so the agent never asks for them"; fi

# 6 · a sign-in the agent can call with a username and password
login_pat="$(cfg '.loginApi // [] | join("|")')"; [ -n "$login_pat" ] || login_pat="sign-?in|login|/auth"
if src | grep -vE 'routes/|pages/|app/.*page\.' | xargs grep -lE "betterAuth\(|\.(post|all|on|route)\(['\"][^'\"]*($login_pat)" 2>/dev/null | grep -q .; then ok "login: a server route signs in with username and password"
else bad "login: no server sign-in route" "serve a username/password sign-in in the API (Better Auth or your own), so curl and the browser both work"; fi

# 7 · every admin action is an API first, a page second
admin_pat="$(cfg '.adminApi // [] | join("|")')"; [ -n "$admin_pat" ] || admin_pat="/admin"
if src | xargs grep -lE "\.(get|post|put|patch|delete|route|all)\(['\"]($admin_pat)" 2>/dev/null | grep -q .; then ok "admin: admin routes in the API ($admin_pat)"
else bad "admin: no admin route in the API" "expose admin actions as API routes (list them under adminApi in agent-ready.json if they are not under /admin)"; fi

# 8 · health the agent can curl
if src | xargs grep -lE "['\"]/(healthz|health|readyz)['\"]" 2>/dev/null | grep -q .; then ok "health: /healthz or /readyz route"; else bad "health: no health route" "add /healthz (version) and /readyz (every dependency)"; fi

# 9 · the agent can drive a real browser
if ls -d .claude/skills/*/ 2>/dev/null | grep -qiE 'brows|chrome|playwright|stagehand' || grep -qiE 'chrome|playwright|browser' .mcp.json 2>/dev/null; then ok "browser: a browser skill or MCP is installed"
else bad "browser: no browser skill or MCP" "install a Chrome or Playwright skill (Claude in Chrome, Stagehand) so the agent can check its own UI"; fi

[ -n "$quiet" ] || echo "agent-ready: $fails gap(s)"
[ "$fails" -eq 0 ]
