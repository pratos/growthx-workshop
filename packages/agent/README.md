# @greenhouse/agent

A durable, resumable agent loop on [`@earendil-works/pi-durable`](https://unpkg.com/@earendil-works/pi-durable@latest/README.md) 1.4.0, backed by one SQLite file. One input with a fixed `requestId`, one slow tool. Kill the process while the tool runs, start it again, and the run continues from its last checkpoint. Start it a third time and the saved answer comes back without a model call.

Files:

- `src/demo.ts`: opens `./agent.sqlite`, opens the Harness, inspects what the last process left behind, calls `resume()`, submits `{ type: "input", content: "What is the checkout status? Use the service_status tool.", requestId: "incident-106" }`, waits, prints the answer, closes.
- `src/tools.ts`: the `service_status` tool. Waits 8 seconds (one second at a time, honouring the abort signal), prints progress, returns `{ checkout: "degraded" }`. Declared `replay: "safe"`, which is how pi-durable is told it may rerun after a crash.
- `src/watch.ts`: a second process that opens the same SQLite file read-only and prints each entry, task status change and submission status change as it is committed.
- `src/storage.ts`: a `bun:sqlite` adapter for pi-durable's portable SQLite storage (see "Deviations").
- `src/model.ts`: picks the provider from whichever key is in the environment.
- `justfile.fragment`: three recipes to paste into the root justfile.

## Setup

From the repo root, once:

```sh
bun install
```

The model key comes from the environment. The script checks, in order, `ANTHROPIC_API_KEY` (Anthropic, `claude-sonnet-5-5`), `OPENROUTER_API_KEY` (`anthropic/claude-sonnet-5.5` through OpenRouter), `OPENAI_API_KEY` (`gpt-5.4-mini`). `AGENT_MODEL=provider/modelId` overrides the model id for that provider. The key is read by pi-ai; nothing here prints it.

On the presenter's machine the keys live in the fish secrets file, so prefix each command with `fish -c 'source ~/.config/fish/conf.d/secrets.fish 2>/dev/null; …'`, or source it once in a fish shell and run the commands plain.

## The demo, as typed

Terminal 2 first, so it is already watching when the first run starts:

```sh
cd packages/agent && bun run watch
```

Terminal 1, three runs of the same command:

```sh
cd packages/agent
bun run reset          # start from nothing
bun run demo           # run 1: when you see "service_status: 3s / 8s", kill it (next line)
bun run demo           # run 2: resumes the interrupted tool call and finishes
bun run demo           # run 3: the saved answer, no model call
```

To kill run 1, from a third terminal (or the watch terminal) while the tool is counting:

```sh
pkill -9 -f src/demo.ts
```

or `kill -9 <pid>` with the pid printed on the first line of run 1's output. `bun run demo` is a parent process around `bun src/demo.ts`; `pkill -f` matches both, so the script itself dies with SIGKILL and nothing closes cleanly. Do not use ctrl-c for the demo: that is a signal the process can handle, which is a different story.

## Expected output (observed 2026-10-28, OpenAI `gpt-5.4-mini`, see "Deviations")

Run 1, killed with `kill -9` 4.7 s after start, during the tool call:

```
05:35:29.641 pid 6063  model openai/gpt-5.4-mini  storage /…/packages/agent/agent.sqlite
05:35:29.658 no unfinished work in storage
05:35:29.661 committed  #7 pi.user  What is the checkout status? Use the service_status tool.
05:35:29.663 submission incident-106 → #8 status placed
05:35:29.667 committed  #10 pi.system  system prompt or tool list changed
05:35:31.139 committed  #11 pi.assistant  tool call: service_status
service_status: 1s / 8s (pid 6063)
service_status: 2s / 8s (pid 6063)
service_status: 3s / 8s (pid 6063)
```

(The shell then prints its own `Killed: 9` or `[1]  + killed`.) Run 2, the same command. It finds the generation task waiting on the tool task, reruns the tool from the start (replay-safe), and finishes. The input is not submitted again: the same `requestId` returns submission #8, still `placed`.

```
05:35:35.332 pid 6414  model openai/gpt-5.4-mini  storage /…/packages/agent/agent.sqlite
05:35:35.342 resuming: 2 unfinished task(s) found in storage
05:35:35.342   task #12 pi.tool pending → ready
05:35:35.342   task #9 pi.generation waiting → waiting
05:35:35.345 transcript already has 3 committed entries
05:35:35.347 submission incident-106 → #8 status placed
service_status: 1s / 8s (pid 6414)
service_status: 2s / 8s (pid 6414)
service_status: 3s / 8s (pid 6414)
service_status: 4s / 8s (pid 6414)
service_status: 5s / 8s (pid 6414)
service_status: 6s / 8s (pid 6414)
service_status: 7s / 8s (pid 6414)
service_status: 8s / 8s (pid 6414)
05:35:43.377 committed  #13 pi.tool-result  service_status → {"checkout":"degraded"}
05:35:44.913 committed  #15 pi.assistant  The checkout service is currently degraded.

ANSWER (9.6s): The checkout service is currently degraded.

05:35:44.920 closed
```

Run 3, the same command again. No tasks, no tool, no model request: the submission is already `done` and the answer entry is read from storage. Total wall time 0.1 s.

```
05:35:45.011 pid 7003  model openai/gpt-5.4-mini  storage /…/packages/agent/agent.sqlite
05:35:45.019 no unfinished work in storage
05:35:45.021 transcript already has 5 committed entries
05:35:45.023 submission incident-106 → #8 status done

ANSWER (0.0s): The checkout service is currently degraded.

05:35:45.025 closed
```

Terminal 2 (`bun run watch`), across all three runs. Entry ids and commit numbers are what SQLite holds; nothing here is in memory in the watcher:

```
05:35:29.577 watching /…/packages/agent/agent.sqlite (ctrl-c to stop)
05:35:29.782 entry  #7 commit 2  pi.user         What is the checkout status? Use the service_status tool.
05:35:29.782 entry  #10 commit 4  pi.system       system prompt or tool list changed
05:35:29.782 task   #9 pi.generation   running
05:35:29.782 submit #8 incident-106 placed
05:35:31.193 entry  #11 commit 7  pi.assistant    tool call: service_status
05:35:31.193 task   #9 pi.generation   waiting
05:35:31.193 task   #12 pi.tool         running
05:35:43.479 entry  #13 commit 24  pi.tool-result  service_status → {"checkout":"degraded"}
05:35:43.479 task   #9 pi.generation   terminal (completed)
05:35:43.479 task   #12 pi.tool         terminal (completed)
05:35:43.479 task   #14 pi.generation   running
05:35:45.089 entry  #15 commit 32  pi.assistant    The checkout service is currently degraded.
05:35:45.089 task   #14 pi.generation   terminal (completed)
05:35:45.089 submit #8 incident-106 done
```

The gap between commit 7 and commit 24 is the tool's running output (`api.output()`), committed into the `pi.live` document about once a second here, so a crash loses at most that much of it. Run 3 adds nothing to the watcher: it wrote nothing.

## What is committed

Everything the demo shows is read back from `agent.sqlite`; nothing is shown before its commit is stored. The transcript is a list of immutable entries: the user input (`pi.user`), the system prompt and tool list (`pi.system`), each model response (`pi.assistant`, here one with a tool call and one with the answer), and each tool result (`pi.tool-result`). Next to the transcript sit tasks: `pi.generation` for each model turn and `pi.tool` for each tool call, each a small state machine whose checkpoint is committed at every step. The submission `incident-106` is a row too, with a status that moves `placed` → `done`. When the process dies, the storage holds a `pi.generation` task waiting on a `pi.tool` task whose checkpoint says "call". The next `Harness.open()` plus `resume()` schedules that tool task again because the tool said `replay: "safe"`; a tool without that flag would instead get an `interrupted` error result written for the model. The third run never reaches the model because `submit()` with the same `requestId` finds the stored submission, already `done`, and `wait()` returns at once. In 12-factor-agents terms (HumanLayer, factors 5, 6 and 12): execution state and business state are one store, launch/pause/resume is the same command three times, and the loop is a reducer over stored entries.

## Deviations from the plan, and library behaviour worth knowing

- **No `node:sqlite` on Bun.** pi-durable's `openNodeSqliteStorage()` imports `node:sqlite`, which Bun 1.3.13 does not provide (`No such built-in module: node:sqlite`). The README says the portable core runs on Bun given an asynchronous `SqliteDatabase` facade, so `src/storage.ts` is that facade over `bun:sqlite` (a port of the package's own Node adapter: WAL, `synchronous = NORMAL`, `BEGIN IMMEDIATE` transactions, a serial queue). `SqliteStorage.open(db)` from `@earendil-works/pi-durable/storage/sqlite` takes it. Running the demo under Node 22+ with `openNodeSqliteStorage` would need no adapter.
- **Tested with OpenAI, not Anthropic.** The machine this was built on has no `ANTHROPIC_API_KEY` anywhere (not in the fish secrets file, not under `~/.config/sops-nix/secrets`), and its `openrouter/api-key` file is empty (0 bytes), so the fish secrets file exports `OPENROUTER_API_KEY=""`, which the script treats as unset. The only working model key present was `openai/api-key`, so every observed run above used `openai/gpt-5.4-mini`. The Anthropic path (`claude-sonnet-5-5`, which is in pi-ai 1.4.0's catalog) and the OpenRouter path (`anthropic/claude-sonnet-5.5`) are written but not exercised. The provider is stored in the conversation's `pi.agent` document on first use, so switching keys needs `bun run reset`.
- **The watcher does not open a Harness.** The README's "Watching a Conversation" API (`viewState()`, `watch()`) is in-process: a view advances from its own Harness's commit publications, and "Storage" says one process owns a storage at a time with no cross-process locking. So `watch.ts` is a read-only `bun:sqlite` connection that polls the `entries`, `tasks` and `submissions` tables every 200 ms; SQLite WAL permits that reader next to the writer. `demo.ts` also subscribes to `viewState()` in-process, which is where its `committed #n` lines come from. One consequence: when run 2 resumes, the tool task goes `pending → running` within one poll, so the watcher shows no status line for it; the demo's own `resuming:` lines show it.
- **`kind` and `request_id` columns are JSON strings.** In the SQLite schema, `tasks.kind` and `submissions.request_id` hold the JSON encoding of the string (with quotes). `watch.ts` strips them. Not documented, not harmful.
- **After the crash, the tool task is `pending`, not `running`.** `harness.inspect()` in run 2 reports the interrupted tool task as `pending → ready` and its generation as `waiting → waiting`. The README describes recovery in terms of tasks continuing from their checkpoint, which matches; the exact status word is just what storage holds after open.
- **Lint and typecheck** pass with `bunx tsc -p packages/agent/tsconfig.json --noEmit` and `bunx oxlint packages/agent`; `oxlint --type-aware` wants the `oxlint-tsgolint` package the root does not have, so the plain run is what was checked. `@types/bun` is a devDependency of this package only, for `bun:sqlite` types.
- Nothing outside `packages/agent` was changed except `bun.lock`, which the workspace install updates.

Next: paste `justfile.fragment` into the root justfile (`just agent-demo`, `just agent-watch`, `just agent-reset`), add a `packages/agent | @earendil-works/* | packages/*` row to the edges table in `docs/ARCHITECTURE.md`, and run the demo once with an Anthropic key before the talk.
