# Run of show · runbook

Every live beat has a deterministic twin. If the agent misbehaves on stage, run the twin and keep going. Tags are the safety net: `git checkout cp-NN` puts the repo exactly where that beat expects it, and `scripts/demo.sh cp-NN` proves it.

## Before the show

```sh
git status                 # clean, on main
just install               # bun workspaces + vendored skills + the artifact builder
just reset                 # fresh local D1 and Durable Object state, migrated and seeded
just up                    # api + web in one process; http://localhost:3000
for c in cp-00 cp-01 cp-02 cp-03 cp-04 cp-05 cp-06 cp-07 cp-08; do scripts/demo.sh $c; done
```

cmux panes: `just up` · a shell on main · `tail -f /tmp/gh-*.log` · the browser on http://localhost:3000/plans/gh-12 with Agentation.

## The beats

| Beat | Live | Twin (always works) | Fallback |
|---|---|---|---|
| Fresh clone, nobody at the keyboard | `git clone … && just up`, open `/login` and `/healthz` | `just demo cp-00` | the two curls in `scripts/demo.sh` |
| Agent names it ThreadClosed | ask pi: "add resolve thread"; watch the names | `git checkout wrong/cp-01 && just glossary-check` fails; on `cp-01` it passes | `just demo cp-01` |
| Tests the agent learns from | ask pi for a test; it writes a mock | `just test`, then `cat packages/domain/src/thread/__expect__/resolve.snap.txt` | `just demo cp-02` |
| Changing a recorded event | ask Claude Code to "add rationale to decisions"; it edits the schema | `cat packages/domain/src/upcast/__expect__/*.snap.txt` | `just demo cp-03` |
| A plan you look at | `/create_plan GH-12` in Claude Code; the hook builds the page | open `docs/plans/2026-10-28-resolve-thread.plan.html`: decision, components, phases | `just plans`, then open the page |
| UI half | Claude Code with impeccable + animate on `/plans/gh-12`; one Agentation note | open a thread, resolve it, see the decision | `just demo cp-05` |
| Correct code that is wrong | `HEAD_REF=wrong/cp-01 just review cp-02` live, about ninety seconds | `cat demo/cp-06-review.md` | `just demo cp-06` |
| A durable agent | terminal 2: `just agent-watch`; terminal 1: `just agent-reset && just agent-demo`, at "service_status: 3s / 8s" run `pkill -9 -f src/demo.ts`, then `just agent-demo` twice | the three observed runs in `packages/agent/README.md` | read the README's output aloud |
| Two people, one room | two tabs on `/plans/gh-12`, open a thread in one, watch the other | `just demo cp-08` | the api socket directly: `bun scripts/ws-check.ts <api url>` |
| Flags, as a panel | https://greenhouse-web.prthamesh-sarang.workers.dev/admin/flags: toggle, allowlist, percent; the same table `decide()` reads | `curl …/flags` on the api | `GH_REMOTE=1 just flag list` |
| Released, then changed | `just deploy`, `GH_REMOTE=1 just flag user resolve-thread <you>`, use it live, `just rollback api <id>` | `curl …/healthz` shows label and id; `GH_REMOTE=1 just flag list` | `just demo cp-07` |

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
just glossary-check                      # cp-01
just replay gh-12                        # the stream as a story (api must be up on :8787, or GH_API=<url>)
just plan docs/plans/2026-10-28-resolve-thread.plan.json   # the plan page; a hook rebuilds it on edit
just plans                               # every plan with status and progress
HEAD_REF=wrong/cp-01 just review cp-02   # model inversion, live
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
