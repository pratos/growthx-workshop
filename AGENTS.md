# Greenhouse

A planning room: people and an agent write a plan together, every decision is owned, dated and attached to the block it changed.

Read `docs/GLOSSARY.md` before naming anything and `docs/ARCHITECTURE.md` before moving anything. Every runnable thing is a `just` recipe; if it is not in the justfile, do not invent a way to run it. Skills in `skills/` load on demand; they hold the detail this file leaves out.

Rules that cannot be a lint:
- Suggest the next step after finishing one.
- Ask whether a change is behind a feature flag before adding a command.
- Never run a migration on deploy. `just deploy` stops if one is pending.
- Never paste or print a secret. `just secret put NAME` is how keys enter the repo.
