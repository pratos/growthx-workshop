# Checkpoints

Rails gets you out of the blocks: `rails new` gives a running, deployable app with sign-in, a database, tests and an admin before anyone thinks about the product. Greenhouse does the same. cp-00 is everything any product needs, nothing specific to this one. cp-01 plans the product. From cp-02 on, every step builds the product.

Each checkpoint is a git tag on one linear line. `just step N` opens it in a worktree of its own, prints what that step added since the one before, and runs its beat (`scripts/demo.sh cp-NN`), so the show works even when the live agent misbehaves. `demo/` holds recorded fallbacks.

| Tag | Step | What it adds | `demo.sh` checks |
|---|---|---|---|
| cp-00 | Out of the blocks | layout, Nix (flake and lock), `just`, oxlint, skills and hooks, the architecture map; two Workers with `/healthz` and `/readyz`; the event-sourcing engine (`packages/engine`); sign-up, sign-in and sign-out on it; seeded admin, person and agent; flags admin API and page, admins only; deploy, version, rollback; the review script | health and readiness; the seeded admin signs in and reaches `/flags`, which refuses everyone else; sign-up and sign-in stories pass; `just agent-ready` has no gaps |
| cp-01 | Plan the product | `PRODUCT.md`, `DESIGN.md`; the decision report "where should the agent's work run?"; the plans (resolve a comment, the domain vocabulary); `docs/DOMAIN-VOCABULARY.md` with the product's words | the report and the plans build with every step validated |
| cp-02 | Name it, model it | the product's schemas; the Thread and Session deciders; their expect stories, one person with the agent and three people with the agent | the vocabulary check passes, the stories pass, and branch `wrong/cp-02` (ThreadClosed) fails the check |
| cp-03 | Change a recorded event | `packages/domain/src/upcast` | a verbatim v1 stream reads as v2 |
| cp-04 | The API and the plan room | the PlanRoom Durable Object (comments, and sessions on the engine over its SQLite), command and session routes, Effect services behind Hono | a signed-in person starts a session and asks; the agent signs in and starts the run |
| cp-05 | The screen, live | the plan page, WebSocket fan-out through the web Worker, Agentation in dev | a socket on the plan room hears an append |
| cp-06 | The durable agent | `packages/agent` on pi-durable: kill -9 mid tool call, run again, it resumes | the agent typechecks; the kill and resume run live |
| cp-07 | Review with a second model | `demo/review-fallback.md` | the review runs with a different model than the author |
| cp-08 | Release | nothing new in code: deploy, flag on for a named slice, then a percentage, flag off, roll back | the live api returns a version label and id; flags are readable remotely |

The planted branch `wrong/cp-02` forks from cp-02: the first pass names the event ThreadClosed with a verdict and makes its own tests pass. cp-02 shows the check catching it; cp-07 shows a second model catching it too.

The tags are snapshots of main, not its history: each is main's tree with the later steps taken out, so every tag runs the final architecture and its lockfile, Worker types and route tree are regenerated inside it. Main also holds the workshop's own files (the deck, the check-in Worker, the workshop page), which no tag carries.
