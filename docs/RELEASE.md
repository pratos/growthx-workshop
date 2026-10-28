# Release checklist

Short on purpose. Lives next to the code; the PR template links it.

## Product fit
- [ ] The user's sentence: one line, in their words, of what is now possible.
- [ ] Dogfooded on real data today.
- [ ] Vocabulary intact: `just domain-vocabulary-check` passes, UI copy uses domain vocabulary words.
- [ ] Signal defined: which event shows it is used, and the number expected in a week.

## Staged rollout
- [ ] Behind a flag, default off: `just flag off NAME` is the state at deploy.
- [ ] You first: `GH_REMOTE=1 just flag user NAME <your id>`, run the Stagehand flow against prod.
- [ ] A named slice: the people you interviewed, told it is on.
- [ ] A percentage: `just flag pct NAME 5`, then 25, then `just flag on NAME`, each with a watch window on error rate and the usage event.
- [ ] Code version separately: `cd apps/api && bunx wrangler versions upload`, then `wrangler versions deploy` from 1% to 100%, on a different day if you can.
- [ ] Migration additive, shipped before the code that needs it; drops and renames a release after.

## Rollback path
- [ ] Written in the PR before deploy: the flag-off command and the previous version id (`/healthz` → `version.id`, or `wrangler deployments list`).
- [ ] Flag off is step one: `GH_REMOTE=1 just flag off NAME`. Seconds, no deploy.
- [ ] Previous version pinned: `just rollback api <version-id>`, same for `web`.
- [ ] Events are facts: never deleted. A bad projection is rebuilt with `just replay`; a bad command is compensated with a new event.
- [ ] Postmortem in `docs/decisions/` before the retry.
