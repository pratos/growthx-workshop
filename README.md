# Greenhouse · Shipping Reliable Products

This folder is the workshop: `reliable-products-workshop.html` is the talk, `apps/checkin` is the pre-workshop check-in, and the rest is Greenhouse, the runnable example.

A planning room in the spirit of GitHub Next's Chopin: people and an agent write a plan together, every decision is owned, dated and attached to the block it changed. Built as the runnable example for the "Shipping Reliable Products" workshop, so each engineering practice can be shown running instead of described.

```sh
git clone … greenhouse && cd greenhouse
nix develop        # or: have bun, just, jq on PATH
just up            # api + web locally; http://localhost:3000
just test
```

Read `AGENTS.md` first, then `docs/DOMAIN-VOCABULARY.md` and `docs/ARCHITECTURE.md`. The checkpoints the workshop walks through are in `docs/CHECKPOINTS.md`; each is a git tag with a `just demo cp-NN` that proves it.

| Where | What |
|---|---|
| `apps/api` | Hono at the edge, Effect behind it: Flags, PlanRooms, Commands and FlagsAdmin services. `PlanRoom` Durable Object holds each plan's event log and fans it out over WebSockets. |
| `apps/checkin` | The workshop's anonymous check-in Worker (growthx-eng.tarp.sh). Separate deploy, same conventions. |
| `apps/web` | TanStack Start Worker. Talks to the api over a service binding only, including the plan's WebSocket. `/admin/flags` panel. Agentation toolbar in dev. |
| `packages/domain` | The decider: commands validate, events are facts, projections are pure. Expect tests read as a story. |
| `packages/schema` | The vocabulary as types. |
| `apps/*/wrangler.jsonc` | Each Worker's bindings as config. `just deploy` runs wrangler for api then web, passes a `git describe` label, and never runs migrations. |
| `docs/` | Domain vocabulary, architecture and its map, release checklist, checkpoints, runbook, decisions, and `plans/`: each plan is JSON rendered to an HTML page by the create-plan skill. |
| `deck/`, `workshop-page/`, `reliable-products-workshop.html` | The talk itself. |
| `skills/` | Loaded by Claude Code and pi. Ours in place; third-party vendored at pinned commits by `just skills`. |

## How we work

One task, end to end, in nine steps: [`docs/WORKFLOW.md`](docs/WORKFLOW.md). Before anything ships, three questions: [`docs/RELEASE.md`](docs/RELEASE.md); every pull request asks them.

