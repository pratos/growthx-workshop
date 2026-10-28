---
name: scaffold
description: "Create or restructure a package, app, Worker, route, command, migration, just recipe, CI job or deployment in this repo the Greenhouse way: two Workers joined by a service binding, health before login before auth, every runnable thing a just recipe, flags default off, migrations by hand. Load before any mkdir under apps/ or packages/, before a new wrangler.jsonc, a new route, a new recipe, a new skill, or a change to scripts/deploy.sh, the CI workflow, flake.nix, .oxlintrc.json or tsconfig.base.json. Pairs with event-sourcing for the domain and ddd-vocabulary for names."
---

# scaffold

A fresh clone has to work with three commands: `just up`, `just test`, `just deploy`. Every rule below exists so that stays true after the agent adds something. The repo is small on purpose; this checklist is what keeps it readable.

## When this fires

- A new folder under `apps/` or `packages/`, or a move between them.
- A new Worker: a new `wrangler.jsonc`, a new service binding, a new deploy target.
- A new HTTP route in `apps/api`, or a new file route in `apps/web/src/routes`.
- A new command (load `event-sourcing` as well), a new D1 migration, a new `just` recipe, a new CI job.
- A change to `scripts/deploy.sh`, `.github/workflows/deploy.yml`, `flake.nix`, `.oxlintrc.json` or `tsconfig.base.json`.
- A new skill under `skills/`.

## Rules

1. **Two Workers, one direction.** `apps/api` (Hono) and `apps/web` (TanStack Start) are separate Workers, deployed separately, API first, joined by the `API` service binding in `apps/web/wrangler.jsonc`. The web Worker reaches data only through `env.API`. It never imports `@greenhouse/domain`, `@greenhouse/db` or a database client; the override in `.oxlintrc.json` fails the lint if it does.
2. **Health, then login, then auth.** Every Worker has a public `/healthz` returning `{ ok, version: { label, id } }`: `label` from the `GIT_DESCRIBE` var (set by `just deploy` from `git describe`), `id` from the `VERSION` metadata binding. Every Worker has `/readyz` that touches each of its dependencies and returns 503 when one fails. The web app serves a public `/login` page before any other page. Auth comes after both: username and password through Better Auth in the API, then Google.
3. **Fresh clone, three commands.** `just up`, `just test` and `just deploy` must work from a clean checkout inside `nix develop`. A scaffold that needs a step outside those is not done.
4. **Secrets never pass through chat.** `just secret put NAME` reads a value without echo into `.dev.vars`. Ask the person to run it; never ask for the value, never print one.
5. **Local D1 is seeded.** `just up` runs `migrate-local` then `seed`. `packages/db/seed.sql` holds an admin and a random user; every flag defaults off. A new table that local dev needs gets its seed rows there, never in a migration.
6. **Migrations are additive and applied by hand.** New file `apps/api/migrations/NNNN_name.sql`, next number, `CREATE` or `ALTER ... ADD` only. Drops and renames ship a release after the code stops using the column, with `ALLOW_DESTRUCTIVE` in the commit message or CI blocks them. `just deploy` refuses while a remote migration is pending and prints the apply command. Never add a migration step to `scripts/deploy.sh` or the deploy job.
7. **Recipe before command.** Anything a person or agent has to run is a `just` recipe first, with a one-line comment above it (that comment is `just --list`). A recipe over a few lines calls a script in `scripts/`. If it is not in the justfile, it does not exist.
8. **Ask about the flag.** Before adding a command, ask whether it is behind a feature flag. Flags live in the D1 `flags` table, are read once per request in the API (`loadFlags`), travel to the Durable Object as a list of names, and are checked in `decide()`. Default off. Never read in the web Worker.
9. **Suggest the next step.** Every scaffold ends with a `Next:` line, the way `scripts/new.sh` and `scripts/deploy.sh` do.
10. **One toolchain.** TypeScript, strict as `tsconfig.base.json`; a new package extends it and loosens nothing. `bunx oxlint --type-aware .` and `bunx oxfmt --check .` pass. Worker `Env` comes from `wrangler types` into `worker-configuration.d.ts`, committed, checked current by CI; never hand-write an `Env` or `Bindings` type.
11. **Hono in front, Effect behind.** Hono owns routing and the request/response. Everything behind a handler is Effect: services as Layers, Schema for types, typed errors. `repos/effect` is the vendored Effect source: read it for idiomatic shapes, never import from it; the dependency is the `effect` package. Code that already uses zod stays as it is until its own change.
12. **Edges are documented.** `docs/ARCHITECTURE.md` lists the allowed import edges. A change that adds one updates that table in the same commit. No edge in the table, no import.
13. **Twelve factors.** When anything under `apps/*`, a `wrangler.jsonc`, `scripts/deploy.sh`, the workflow or `flake.nix` changes, run the checker in `tools/twelve-factor-baml` against the Worker. When `packages/agent` changes, read HumanLayer's 12-factor agents list (github.com/humanlayer/12-factor-agents) before writing code.
14. **Names come from the domain vocabulary.** A noun in a route, table, command or UI label goes through `ddd-vocabulary` first. `just domain-vocabulary-check` passes.

## Build sequence

1. **Name it** with `ddd-vocabulary`. Say which folder gets it, using `references/layout.md`.
2. **Check the edge** in `docs/ARCHITECTURE.md`. New edge: update the table now, or stop and ask.
3. **Ask the flag question** if the change is a command. Then load `event-sourcing` and run `just new command Name`.
4. **Write the recipe** in the justfile first, comment included. Then the script it calls.
5. **Write the thing.** Worker: follow `references/new-worker.md` step by step. Route: copy the `/healthz` and `/readyz` handlers' shape. Migration: next number, additive, seed rows in `packages/db/seed.sql`.
6. **Generate types**: `cd apps/<worker> && bunx wrangler types`. Commit `worker-configuration.d.ts`.
7. **Run it**: `just lint`, `just test`, `just up`, then `curl localhost:8787/healthz` and `/readyz` (web on `:3000`).
8. **Twelve-factor check** if rule 13 applies. Fix what fails before moving on.
9. **Run `references/checklist.md`.** Then write the `Next:` line.

## Reference

- `references/layout.md`: the repo tree, one line per folder, and where a new Worker, package, route, command, migration and skill go.
- `references/new-worker.md`: the exact files and fields for a new Worker: `wrangler.jsonc`, the health handlers, types, lint boundary, justfile, deploy order, CI, docs.
- `references/checklist.md`: what the agent runs before saying a scaffold is done.
