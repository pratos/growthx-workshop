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
| packages/domain | packages/schema, zod | anything with I/O |
| packages/schema | zod | everything else |
| infra | nothing from apps or packages | |

## Decisions already made

- **D1 everywhere.** Local D1 through wrangler, prod D1. Postgres through Hyperdrive is an option the deploy file documents, not a default.
- **The event log lives in the PlanRoom DO**, one per Plan. Single writer, strong order, append in one synchronous block. D1 holds auth, flags and cross-plan projections rebuilt by `just replay`.
- **Flags are evaluated in `decide()`**, from a D1 table read once per request and passed to the DO as a list of names. Never in the web Worker. Default off.
- **Migrations never run on deploy.** `just deploy` stops if any are pending; they are applied by hand and are additive.
- **The web Worker has no data access.** It reads through the API binding. A database import under `apps/web` is a lint error.
- **Everything that runs is a `just` recipe**, so the agent and the sandbox use the same commands a person does.
