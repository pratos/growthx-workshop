# Done means

Run this list before saying a scaffold is finished. Every line is a command or a file to open; none is a judgement call.

## Always

- [ ] Every new noun is in `docs/DOMAIN-VOCABULARY.md`; `just domain-vocabulary-check` passes.
- [ ] Every new import edge is a row in `docs/ARCHITECTURE.md`, in this commit.
- [ ] Anything a person or agent runs is a `just` recipe with a comment line. `just --list` shows it.
- [ ] `just lint` passes: oxlint type-aware, oxfmt, tsc for every Worker.
- [ ] `just test` passes.
- [ ] `just up` starts from a clean `.wrangler/state` (`just reset` first) and `/healthz`, `/readyz`, `/login` answer.
- [ ] No secret in a file that is committed, in a `vars` block, in a log line or in this conversation.
- [ ] The last message to the person starts with `Next:`.

## If a Worker was added or its bindings changed

- [ ] `wrangler.jsonc` has `observability`, `version_metadata` (`VERSION`), `vars.GIT_DESCRIBE`, the shared `compatibility_date`.
- [ ] `/healthz` returns `version.label` and `version.id`; `/readyz` touches every binding and returns 503 on failure.
- [ ] `bunx wrangler types` was run and `worker-configuration.d.ts` is committed; no hand-written `Env`.
- [ ] The web-side override in `.oxlintrc.json` covers it if it must not reach the domain or a database.
- [ ] `scripts/deploy.sh` deploys it in dependency order, api first.
- [ ] `.github/workflows/deploy.yml` has its types check, versions upload and smoke curl.
- [ ] `README.md` table and `docs/RUNBOOK.md` Live list mention it.
- [ ] The twelve-factor checker in `tools/twelve-factor-baml` ran against it with no FAIL.

## If a command was added

- [ ] The flag question was asked and answered; the check is in `decide()`, default off, seeded off in `packages/db/seed.sql`.
- [ ] `just new command Name` was the starting point; the expect test is filled and its snapshot reads as prose.
- [ ] The route goes through `dispatch()`; nothing writes events from a handler.

## If a migration was added

- [ ] Next number, additive only; no `DROP` or `RENAME` (or `ALLOW_DESTRUCTIVE` is in the commit message and the release notes say why).
- [ ] `just migrate-local` applies it; `just seed` still runs.
- [ ] The PR says it must be applied to remote before `just deploy`, and `just deploy` was not changed to do it.

## If `packages/agent` changed

- [ ] HumanLayer's 12-factor agents list was read and the PR names the factors the change touches.

## If a skill was added

- [ ] `skills/<name>/SKILL.md` has frontmatter `name` and `description`, and the four sections.
- [ ] `skills/README.md` has its row; `just skills` was run so `.claude/skills` and `.pi/skills` link it.
