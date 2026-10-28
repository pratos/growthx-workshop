# Agent-ready checklist

Each item: what done looks like, why the agent needs it, how `check.sh` decides.

## 1. .gitignore per stack

**Done:** every language and framework in the repo has its ignores. Node: `node_modules`, `dist`. Wrangler: `.wrangler`, `.dev.vars*`. Python: `.venv`, `__pycache__`, `.pytest_cache`. Next.js: `.next`. Rust: `target`. Any `.env`.
**Why:** the agent greps and globs the tree. Build output and caches it should never read cost tokens and mislead; ignored secrets never reach a commit.
**Check:** detects each stack from its marker file and looks for the entries in `.gitignore`.

## 2. A pinned Nix flake

**Done:** `flake.nix` with a devShell listing every tool, `flake.lock` committed. Enter with `nix develop` or direnv `use flake`. Python runs only as `uv run`, with uv from the flake.
**Why:** nothing gets installed into anyone's system Python or Homebrew, and the agent's sandbox gets the same versions as your laptop. Without the lock, every clone resolves its own nixpkgs.
**Check:** both files exist; uv is in the flake when the repo has Python.

## 3. Local CLIs for every service

**Done:** whichever services the repo talks to, their CLI is pinned: `wrangler` (Cloudflare), `flyctl` (Fly), `docker` / `docker-client`, `postgresql` (psql and a local server).
**Why:** the agent works through CLIs, not dashboards. A missing CLI turns into "please run this in the console for me".
**Check:** wrangler config → wrangler in `package.json` or the flake; `fly.toml` → flyctl; Dockerfile or compose → docker; Postgres in code → postgresql.

## 4. One-command local data

**Done:** `just up`, `just test`, `just seed`, `just reset` (wipe local state, migrate, seed).
**Why:** the agent can get back to a known state in one command after it breaks something, without asking.
**Check:** the four recipes exist.

## 5. Two seeded logins

**Done:** the seed creates one admin and one regular user with known, local-only passwords. `.dev.vars.example` (or `.env.example`) names them: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `USER_EMAIL`, `USER_PASSWORD`.
**Why:** the agent tests both sides of every permission check, and never asks a person to log in for it.
**Check:** a seed file inserts users and mentions admin; the env example has the four names.

## 6. Username and password sign-in in the API

**Done:** a server route signs in with username and password (Better Auth or your own). OAuth comes after, never instead.
**Why:** curl, tests and the browser all log in the same way. An OAuth-only app is a wall for an agent.
**Check:** a server file calls `betterAuth(` or defines a sign-in, login or auth route.

## 7. Admin as an API first

**Done:** every admin action (flags, users, roles, data fixes) is an HTTP route. The admin page calls those routes.
**Why:** the agent administers with curl and verifies with the page; a page-only admin needs a browser for every change.
**Check:** a route under `/admin`, or under the prefixes listed in `agent-ready.json`.

## 8. Health routes

**Done:** `/healthz` returns the running version; `/readyz` touches every dependency and names the one that fails.
**Why:** the agent's first question after a deploy or `just up` is "is it up, and which version".
**Check:** a `/healthz`, `/health` or `/readyz` route.

## 9. A browser for the agent

**Done:** a Chrome or Playwright skill (Claude in Chrome, Stagehand, Playwright) in `.claude/skills`, or a browser MCP in `.mcp.json`.
**Why:** the agent checks its own UI instead of asking you for a screenshot.
**Check:** a skill or MCP whose name says browser, Chrome, Playwright or Stagehand.

## Also useful, not checked

- `just --list` as the menu: every runnable thing is a recipe with a one-line comment.
- Quiet tools: tests and linters print nothing on success and one line per failure.
- Logs from a CLI (`wrangler tail`, `fly logs`), not a dashboard.
- Fixed local ports, written in the README.
- A recorded fallback for anything slow or flaky in a demo.
