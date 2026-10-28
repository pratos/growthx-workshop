# Run of show · runbook

Every live beat has a deterministic twin. If the agent misbehaves on stage, run the twin and keep going. Tags are the safety net: `git checkout cp-NN` puts the repo exactly where that beat expects it.

Before the show: `just install`, `just reset`, `just up` in one cmux pane, `git checkout main` in another. Keep `/tmp/gh-*.log` tails in a third.

| Beat | Live | Twin (always works) | Fallback |
|---|---|---|---|
| Fresh clone, nobody at the keyboard | `git clone … && just up`, open http://localhost:3000/login and /healthz | `just demo cp-00` | the two curls in `scripts/demo.sh` |
| Agent names it ThreadClosed | ask pi: "add resolve thread"; watch the names | `git checkout wrong/cp-01 && just glossary-check` fails; `git checkout cp-01 && just glossary-check` passes | `just demo cp-01` |
| Tests the agent learns from | ask pi for a test; it writes a mock | `just test`, then `cat packages/domain/src/thread/__expect__/resolve.snap.txt` | `just demo cp-02` |
| Changing a recorded event | ask Claude Code to "add rationale to decisions"; it edits the schema | `cat packages/domain/src/upcast/__expect__/*.snap.txt` | `just demo cp-03` |
| Plan as a wall of Markdown | `/create_plan GH-12` in Claude Code | open `docs/decisions/gh-12.html`, click an option | `just demo cp-04` |
| UI half | Claude Code with impeccable + animate on `/plans/gh-12`; Agentation note | http://localhost:3000/plans/gh-12 resolve a thread | `just demo cp-05` |
| Correct code that is wrong | `HEAD_REF=wrong/cp-01 just review cp-02` live (90 s) | `cat demo/cp-06-review.md` | `just demo cp-06` |
| Released, then changed | `just deploy`, flag on for you, `wrangler rollback` | `GH_REMOTE=1 just flag list`, `docs/RELEASE.md` | the check-in Worker, same commands |

## Timings that matter

- `just up` from a fresh clone: measure the morning of. Over three minutes means attendees watch Run 1 and follow in Run 2.
- The live review takes about ninety seconds. Start it, take a question, come back.
- `just deploy` for both Workers takes about a minute. Run it before the break if the network is slow.

## Commands you will type

```sh
just up                                  # api + web, D1 and DO in miniflare
just test                                # expect tests then api tests
just glossary-check                      # the cp-01 beat
just replay gh-12                        # the stream as a story
just artifact docs/decisions/gh-12.spec.json docs/decisions/gh-12.html
HEAD_REF=wrong/cp-01 just review cp-02   # model inversion, live
just flag user resolve-thread <id>       # rollout, you first
just deploy                              # wrangler: api then web; stops on pending migrations
```

## If something is on fire

- Web dev server stuck: `pkill -f "vite dev"` then `just up`.
- D1 or DO state weird: `just reset`.
- Compatibility date error from workerd: the bundled runtime is older than the date; lower `compatibility_date` in both `wrangler.jsonc` files.
- Wrangler not logged in: `bunx wrangler login`, then `just deploy`.
