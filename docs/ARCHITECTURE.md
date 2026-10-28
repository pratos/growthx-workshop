# Architecture

Two Workers joined by a service binding, one Durable Object per Plan, one D1. The event log is the system of record; everything else is a projection. `just arch` (coming) diffs the real import graph against the edges below; the oxlint boundary rule enforces the one that matters most today.

```
apps/web (TanStack Start · Worker)  ──service binding──▶  apps/api (Hono · Worker)
        │ imports                                              │ imports
        ▼                                                      ▼
  packages/schema                                 packages/domain ──▶ packages/schema
                                                       │
                                     PlanRoom DO (SQLite: the plan's event log)
                                                       │
                                     D1 (flags · auth · cross-plan projections)
                                                       ┆ optional: Hyperdrive ──▶ Postgres
```

## Allowed edges

| From | May import | Must not import |
|---|---|---|
| apps/web | packages/schema, the API over `env.API` | packages/domain, packages/db, any database client |
| apps/api | packages/domain, packages/schema | apps/web |
| packages/agent | @earendil-works/pi-durable, pi-ai, chord; bun:sqlite | apps/*, packages/domain (for now: a standalone harness demo) |
| apps/checkin | nothing; a standalone Worker that shares the toolchain | packages/* |
| packages/domain | packages/schema, zod | anything with I/O |
| packages/schema | zod | everything else |
| .github/workflows | runs the same `just` recipes | |

## Decisions already made

- **D1 everywhere.** Local D1 through wrangler, prod D1. Postgres through Hyperdrive is an option (a `hyperdrive` binding in `apps/api/wrangler.jsonc`), not a default.
- **The event log lives in the PlanRoom DO**, one per Plan. Single writer, strong order, append in one synchronous block. D1 holds auth, flags and cross-plan projections rebuilt by `just replay`.
- **Flags are evaluated in `decide()`**, from a D1 table read once per request and passed to the Durable Object as a list of names. A function would cross the RPC boundary as an async stub and its promise would read as true; that bug was caught by the first smoke test. Never in the web Worker. Default off.
- **Migrations never run on deploy.** `just deploy` stops if any are pending; they are applied by hand and are additive.
- **The web Worker has no data access.** It reads through the API binding. A database import under `apps/web` is a lint error.
- **`/healthz` carries two versions**: a `label` from `git describe` for people, an `id` from the version metadata binding for `wrangler rollback`. The deploy passes the label in as a var.
- **Hono is the edge, Effect is everything behind it.** `apps/api/src/services.ts`: Flags, PlanRooms and Commands are services with Layers; handlers run programs through one ManagedRuntime per env; rejections are typed errors; tests swap the D1 and Durable Object layers for in-memory ones. The vendored Effect source at `repos/effect` is read-only reference.
- **Multiplayer is the Durable Object's job.** Every open tab holds a hibernating WebSocket on the plan's object; an append broadcasts to all of them. The browser reaches the socket through the web Worker, which proxies the upgrade over the service binding.
- **Everything that runs is a `just` recipe**, so the agent and the sandbox use the same commands a person does.
