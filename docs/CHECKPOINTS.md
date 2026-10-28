# Checkpoints

Rails gets you out of the blocks: `rails new` gives a running, deployable app with sign-in, a database, tests and an admin before anyone thinks about the product. Greenhouse does the same. cp-00 is everything any product needs, nothing specific to this one. cp-01 plans the product. From cp-02 on, every step builds the product.

Each checkpoint is a branch, `cp-NN-<what it adds>`, on one linear line: every branch is the one before plus one thing that is implemented and can be demoed, so comparing two neighbours on GitHub shows exactly that step. A tag `cp-NN` points at the same commit. `just step N` opens the branch in a worktree of its own, prints what that step added, and runs its beat (`scripts/demo.sh cp-NN`), so the show works even when the live agent misbehaves. `demo/` holds recorded fallbacks.

| Branch | Step | What it adds | `demo.sh` checks |
|---|---|---|---|
| `cp-00-out-of-the-blocks` | Out of the blocks | layout, Nix (flake and lock), `just`, oxlint, skills and hooks, the architecture map; two Workers with `/healthz` and `/readyz`; the event-sourcing engine (`packages/engine`); sign-up, sign-in and sign-out on it; seeded admin, person and agent; flags admin API and page, admins only; deploy, version, rollback | health and readiness; the seeded admin signs in and reaches `/flags`, which refuses everyone else; sign-up and sign-in stories pass; `just agent-ready` has no gaps |
| `cp-01-plan-the-product` | Plan the product | `PRODUCT.md`, `DESIGN.md`; the decision report "where should the agent's work run?"; the plans (resolve a comment, the domain vocabulary); `docs/DOMAIN-VOCABULARY.md` with the product's words | the report and the plans build with every step validated |
| `cp-02-name-it-model-it` | Name it, model it | the product's schemas; the Thread and Session deciders; their expect stories, one person with the agent and three people with the agent | the vocabulary check passes, the stories pass, and branch `wrong/cp-02` (ThreadClosed) fails the check |
| `cp-03-change-a-recorded-event` | Change a recorded event | `packages/domain/src/upcast` | a verbatim v1 stream reads as v2 |
| `cp-04-api-and-plan-room` | The API and the plan room | the PlanRoom Durable Object (comments, and sessions on the engine over its SQLite), command and session routes, Effect services behind Hono | a signed-in person starts a session and asks; the agent signs in and starts the run |
| `cp-05-the-screen-live` | The screen, live | the plan page, WebSocket fan-out through the web Worker, Agentation in dev | a socket on the plan room hears an append |
| `cp-06-durable-agent` | The durable agent | `packages/agent` on pi-durable: kill -9 mid tool call, run again, it resumes | the agent typechecks; the kill and resume run live |
| `cp-07-review` | Review with a second model | `just review`: diffs a branch, puts the domain vocabulary before the diff, and asks a model other than the author (`--prompt` shows exactly what it sends); `demo/review-fallback.md` | the reviewer's prompt holds the vocabulary and the planted branch's ThreadClosed |
| `cp-08-release-behind-a-flag` | Release behind a flag | `GET /participants/:id/flags`; the plan page shows Resolve only when `resolve-thread` is on for the participant, and rechecks when the tab regains focus | Resolve is on for admin and off for Sam; the live api returns a version label and id |

The planted branch `wrong/cp-02` forks from `cp-02-name-it-model-it`: the first pass names the event ThreadClosed with a verdict and makes its own tests pass. cp-02 shows the check catching it; cp-07 shows a second model catching it too.

The tags are snapshots of main, not its history: each is main's tree with the later steps taken out, so every tag runs the final architecture and its lockfile, Worker types and route tree are regenerated inside it. Main also holds the workshop's own files (the deck, the check-in Worker, the workshop page), which no tag carries.
