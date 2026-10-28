# Run of show · runbook

Every live beat has a deterministic twin. If the agent misbehaves on stage, run the twin and keep going. Tags are the safety net: `just step N` opens checkpoint N in its own worktree, shows what that step added, and proves the beat. Main's folder, and the deck in it, is never touched.

## Before the show

```sh
git status                 # clean, on main
just install               # bun workspaces + vendored skills + the artifact builder
just reset                 # fresh local D1 and Durable Object state, migrated and seeded
just up                    # api + web in one process; http://localhost:3000
for n in 0 1 2 3 4 5 6 7 8; do just step $n; done   # every tag, in its own worktree
```

cmux panes: `just up` · a shell on main · `tail -f /tmp/gh-*.log` · the browser on http://localhost:3000/plans/gh-12 with Agentation.

## The beats

| Step | Live | Twin (always works) | Fallback |
|---|---|---|---|
| 0 · Out of the blocks | `git clone … && just up`; `/healthz`, sign up at `/signup`, sign in as the seeded admin, `/admin/flags`; `just agent-ready` | `just step 0` | the curls in `scripts/demo.sh` (cp-00) |
| 1 · Plan the product | `/create_plan` for the coding agent in Claude Code; it turns "where should the agent's work run?" into a report | open `docs/decisions/agent-loop.html`: compare the three places, choose one; then `docs/plans/2026-10-28-resolve-thread.plan.html` | `just step 1` |
| 2 · Name it, model it | ask pi: "add resolve thread"; watch the names | `cat packages/domain/src/session/__expect__/three-people.snap.txt`; `git checkout wrong/cp-02 && just domain-vocabulary-check` fails | `just step 2` |
| 3 · Change a recorded event | ask Claude Code to "add rationale to decisions"; it edits the schema | `cat packages/domain/src/upcast/__expect__/*.snap.txt` | `just step 3` |
| 4 · The API and the plan room | two terminals signed in as Sam and the agent: start a session, ask, the agent starts the run | `just step 4` | `cat packages/domain/src/session/__expect__/one-person.snap.txt` |
| 5 · The screen, live | Claude Code with impeccable + animate on `/plans/gh-12`; one Agentation note; two tabs, open a thread in one | `just step 5` | `bun scripts/ws-check.ts <api url>` |
| 6 · The durable agent | terminal 2: `just agent-watch`; terminal 1: `just agent-reset && just agent-demo`, at "service_status: 3s / 8s" run `pkill -9 -f src/demo.ts`, then `just agent-demo` twice | the three observed runs in `packages/agent/README.md` | read the README's output aloud |
| 7 · Review with a second model | `HEAD_REF=wrong/cp-02 just review cp-02` live, about ninety seconds | `cat demo/review-fallback.md` | `just step 7` |
| 8 · Release | `just deploy`, `GH_REMOTE=1 just flag user resolve-thread <you>`, use it live, `just rollback api <id>` | `curl …/healthz` shows label and id; `GH_REMOTE=1 just flag list` | `just step 8` |

## The map

`docs/architecture/index.html` (serve with `just deck`, open `/docs/architecture/`). Step ids: open, ask, check, record, share, agent, resume, release; `#share` opens on that step.

## Live

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
HEAD_REF=wrong/cp-02 just review cp-02   # model inversion, live
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
