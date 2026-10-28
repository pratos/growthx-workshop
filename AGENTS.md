# Greenhouse

A planning room: people and an agent write a plan together, every decision is owned, dated and attached to the block it changed.

Hono is the HTTP edge; everything behind it is Effect. The Effect repository is vendored at `repos/effect` as read-only reference: inspect it for idiomatic patterns and read `repos/effect/LLMS.md` before writing Effect code. Never edit or import from `repos/`.

Read `docs/DOMAIN-VOCABULARY.md` before naming anything and `docs/ARCHITECTURE.md` before moving anything. Every runnable thing is a `just` recipe; if it is not in the justfile, do not invent a way to run it. Skills in `skills/` load on demand; they hold the detail this file leaves out.

Rules that cannot be a lint:
- Suggest the next step after finishing one.
- Ask whether a change is behind a feature flag before adding a command.
- Never run a migration on deploy. `just deploy` stops if one is pending.
- Never paste or print a secret. `just secret put NAME` is how keys enter the repo.

## Working on a stage

On a workshop branch, `.stage` names the one stage you are building (for example `cp-04`), and its plan is the contract: `just next` prints it, `docs/plans/stages/cp-NN-*.plan.html` shows it as a page.

1. Read the plan before writing anything. Build its phases in order, touching only the files they list. Tests, their snapshots and generated files are always fine.
2. An edit to any other file is refused (a Claude Code hook, the same rule as an Amp plugin in `.amp/plugins/`, and the pre-commit hook for everyone else). If the plan really is missing a file, add it to the right phase's changes with a one-line intent and set `"change": { "intent": "why" }` first; the plan's versions record it.
3. After each phase, run its checks. `just stage-check` runs them all and lists anything changed outside the plan.
4. Stop when every check passes. Do not start the next stage, refactor, or tidy beyond the plan; compare with the stage's pull request instead.
