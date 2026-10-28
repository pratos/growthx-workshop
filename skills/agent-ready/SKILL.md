---
name: agent-ready
description: Make a repo something an agent can clone, run, seed, log into, administer and check in a browser without asking a person. Use when setting up a new repo, adding a language, framework, service, database or deploy target, touching .gitignore, flake.nix, the justfile, the seed, env examples, auth or admin routes, or when the agent had to ask a person for a step. Runs scripts/check.sh; hooks re-run it on session start and after edits to the files it reads.
---

# agent-ready

If the agent cannot run the thing in its own environment, you become the test harness. This skill is the list of things that stop that from happening, and a check that says which are missing.

Run `just agent-ready` (or `skills/agent-ready/scripts/check.sh`). Every line is ✓ or ✗ with the fix. Fix the ✗ lines in the order listed; later ones depend on earlier ones.

## The checklist

Full wording, why each matters, and what counts as done: [references/checklist.md](references/checklist.md).

1. **.gitignore per stack.** Every language and framework in the repo has its ignores (start from github.com/github/gitignore).
2. **A pinned Nix flake.** `flake.nix` with every tool in the devShell, and a committed `flake.lock`. Python only through `uv` from the flake.
3. **Local CLIs for every service.** wrangler, flyctl, docker, psql: whichever the repo talks to, pinned in the flake or `package.json`.
4. **One-command local data.** `just up`, `just test`, `just seed`, `just reset`.
5. **Two seeded logins.** One admin, one regular user, local-only passwords, named in `.dev.vars.example` or `.env.example` as `ADMIN_EMAIL`/`ADMIN_PASSWORD`, `USER_EMAIL`/`USER_PASSWORD`.
6. **Username and password sign-in in the API.** curl and the browser use the same route.
7. **Admin as an API first.** Every admin action is a route; the admin page calls it.
8. **Health routes.** `/healthz` with the version, `/readyz` touching every dependency.
9. **A browser for the agent.** A Chrome or Playwright skill (Claude in Chrome, Stagehand) installed in `.claude/skills` or `.mcp.json`.

## Hooks

`.claude/settings.json` runs `scripts/hook.sh session` at session start (prints open gaps as context) and `scripts/hook.sh post` after Edit or Write on a file the check reads. Neither blocks; both tell the agent what is still missing.

## Overrides

`agent-ready.json` at the repo root, all keys optional: `seed` (seed files), `adminApi` (admin route prefixes when they are not `/admin`), `loginApi` (sign-in route patterns), `envExample` (the env example file).

## Rules

- Never ask the person for a password, token or step the checklist covers. Fix the gap instead, or say which ✗ line blocks you.
- Test logins are local only. Never seed them in a remote database, never put real credentials in an example file.
