# Greenhouse

A planning room in the spirit of GitHub Next's Chopin: people and an agent write a plan together, every decision is owned, dated and attached to the block it changed. Built as the runnable example for the "Shipping Reliable Products" workshop, so each engineering practice can be shown running instead of described.

```sh
git clone … greenhouse && cd greenhouse
nix develop        # or: have bun, just, jq on PATH
just up            # api + web locally; http://localhost:3000
just test
```

Read `AGENTS.md` first, then `docs/GLOSSARY.md` and `docs/ARCHITECTURE.md`. The checkpoints the workshop walks through are in `docs/CHECKPOINTS.md`; each is a git tag with a `just demo cp-NN` that proves it.

| Where | What |
|---|---|
| `apps/api` | Hono Worker: `/healthz`, `/readyz`, commands in, events out. `PlanRoom` Durable Object holds each plan's event log. |
| `apps/web` | TanStack Start Worker. Talks to the api over a service binding only. Agentation toolbar in dev. |
| `packages/domain` | The decider: commands validate, events are facts, projections are pure. Expect tests read as a story. |
| `packages/schema` | The vocabulary as types. |
| `apps/*/wrangler.jsonc` | Each Worker's bindings as config. `just deploy` runs wrangler for api then web and never runs migrations. |
| `skills/` | Loaded by Claude Code and pi. Ours in place; third-party vendored at pinned commits by `just skills`. |
