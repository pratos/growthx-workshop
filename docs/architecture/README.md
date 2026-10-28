# Architecture map

`index.html` is built from `docs/ARCHITECTURE.md` by `just arch`; do not edit it by hand. It is a plain-language map a person steps through: what happens when someone uses Greenhouse, from opening a plan to a feature being switched on for everyone. Open a step directly with its id, for example `index.html#share`.

- Change the map by editing the Mermaid block, the walkthrough or the "Where it lives" table in `docs/ARCHITECTURE.md`.
- A Claude Code hook (`scripts/hooks/arch-hook.sh`) rebuilds it on every edit to that file, and stops the agent when a new folder under `apps/` or `packages/` has no row in "Where it lives".
- The git pre-commit hook does the same for commits from pi or a person; `just install` turns it on.
- CI fails if the map is stale.
