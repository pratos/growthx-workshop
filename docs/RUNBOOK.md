# Run of show · runbook

Every live beat has a deterministic twin. If the agent misbehaves on stage, run the twin and keep going. Tags are the safety net: `just step N` opens checkpoint N in its own worktree, shows what that step added, and proves the beat. Main's folder, and the deck in it, is never touched.

## Before the show

```sh
git status                 # clean, on main
just install               # bun workspaces + vendored skills + the artifact builder
just reset                 # fresh local D1 and Durable Object state, migrated and seeded
just up                    # api + web in one process; http://localhost:3000
for n in $(seq 0 10); do just step $n; done   # every stage, in its own worktree
```

cmux panes: `just up` · a shell on main · `tail -f /tmp/gh-*.log` · the browser on http://localhost:3000/plans/gh-12 with Agentation.

## The beats

| Stage | Live | Twin (always works) |
|---|---|---|
| 0 · Scaffold | `git clone … && just up`; `/healthz`; `just agent-ready` | `just step 0` |
| 1 · First deploy | merge PR cp-01 into `main`; Actions deploys greenhouse-demo.tarp.sh; its `/healthz`; `just rollback api <id> demo` | `just step 1` |
| 2 · Design | the architecture map; `docs/decisions/agent-loop.html`; ask pi to "add resolve thread" and watch the names | `just step 2` |
| 3 · Engine, sign-up and sign-in | sign up at `/signup`; `cat packages/domain/src/account/__expect__/sign-up.snap.txt` | `just step 3` |
| 4 · Admin | sign in as Admin, `/admin`; as Sam, refused; `just e2e admin` | `just step 4` |
| 5 · The plan document | two tabs on `/plans/gh-12`; resolve a thread; `just review main` on the branch the agent wrote | `just step 5` |
| 6 · Chat with the agent | start a session, ask; `just agent-serve` answers; a second browser joins and steers | `just step 6` |
| 7 · UI and UX | Claude Code with impeccable and animate; one Agentation note | `just step 7` |
| 8 · The agent's failures | `cat packages/agent/test/__expect__/fails-after-three.snap.txt`; with a key, `kill -9` the agent mid-answer and run it again | `just step 8` |
| 9 · End to end | `just e2e` | `just step 9` |
| 10 · Release behind a flag | on greenhouse.tarp.sh: `GH_REMOTE=1 just flag user resolve-thread <you>`, switch back to the tab, Resolve appears; flag off, it goes | `just step 10` |

## The map

`docs/architecture/index.html` (serve with `just deck`, open `/docs/architecture/`). Step ids: open, ask, check, record, share, agent, resume, release; `#share` opens on that step.

## Live

- Deploying from GitHub (secrets, the first deploy, failures): `docs/DEPLOY.md`

- api: https://greenhouse-api.prthamesh-sarang.workers.dev · `/healthz` returns `version.label` (git describe, for people) and `version.id` (for rollback)
- web: https://greenhouse-web.prthamesh-sarang.workers.dev · `/healthz` and `/readyz` through the binding · `/admin/flags`
- check-in: https://growthx-eng.tarp.sh · `just checkin deploy`
- previous version ids: `cd apps/api && bunx wrangler deployments list`

## Commands you will type

```sh
just up                                  # api + web locally, D1 and DO in miniflare
just test                                # expect tests then api tests
just domain-vocabulary-check            # step 2
just step 4                              # checkpoint 4 in its own worktree, what it added, its beat
just user-add EMAIL NAME admin           # asks for the password; GH_REMOTE=1 for prod
just replay gh-12                        # the stream as a story (api must be up on :8787, or GH_API=<url>)
just plan docs/plans/2026-10-28-resolve-thread.plan.json   # the plan page; a hook rebuilds it on edit
just plans                               # every plan with status and progress
just review main                         # model inversion, live, on the branch the agent wrote
just deploy                              # wrangler: api then web; refuses if a D1 migration is pending
GH_REMOTE=1 just flag user resolve-thread pratos
GH_REMOTE=1 just flag off resolve-thread
just rollback api <version-id>
```

## Keys

- The agent demo needs a model key in the environment. On this machine only `openai/api-key` under `~/.config/sops-nix/secrets` is populated; export it as `OPENAI_API_KEY` in the shell that runs the demo. With `ANTHROPIC_API_KEY` set it uses `claude-sonnet-5-5`; run `just agent-reset` after switching providers.

## Timings

- `just up` from a fresh clone: measure the morning of. Over three minutes means attendees watch Run 1 and follow in Run 2.
- The live review takes about ninety seconds. Start it, take a question, come back.
- `just deploy` for both Workers takes about a minute including the smoke.

## If something is on fire

- Web dev server stuck: `pkill -f "vite dev"` then `just up`.
- D1 or DO state weird: `just reset`.
- workerd refuses the compatibility date: the bundled runtime is older than the date; lower `compatibility_date` in both `wrangler.jsonc` files.
- `wrangler` not logged in: `bunx wrangler login`.
- Flag gate passes for everyone: the flags must reach the Durable Object as a list of names, never as a function (RPC turns functions into async stubs).
- Hydration error on the plan page: a timestamp was formatted in a locale; render the ISO string.
