# Checkpoints

The architecture map is one page, `docs/architecture/index.html`, built from `docs/ARCHITECTURE.md` by `just arch` and kept current by a hook. It is plain language: the states a person works through, not the code.

Each checkpoint is a git tag. Each has one deterministic beat (`scripts/demo.sh cp-NN`) that fails before the checkpoint's file exists and passes after, so the show works even when the live agent behaves. `demo/` holds recorded fallbacks.

| Tag | Beat shown live | File that fixes it | `demo.sh` checks |
|---|---|---|---|
| cp-00 | Fresh clone, nobody at the keyboard. `just up`, `/healthz`, `/login`. | justfile, flake.nix, both `wrangler.jsonc` | api answers `/healthz` and `/readyz` |
| cp-01 | `/create_plan GH-12` returns a wall of Markdown. | `docs/decisions/gh-12.spec.json` + viz-explainer | the decision report builds with every step validated |
| cp-02 | "Add resolve thread." Agent names it ThreadClosed with a verdict. | `docs/DOMAIN-VOCABULARY.md` + `check-domain-vocabulary.sh` + the web import boundary in `.oxlintrc.json` | check passes on the tag, fails on branch `wrong/cp-02` |
| cp-03 | Agent writes a unit test with a mock. | the expect harness in `packages/domain/src/kernel.ts` | `bun test` runs the Thread decider snapshots, read as prose |
| cp-04 | Agent edits a recorded event's shape in place. | `packages/domain/src/upcast` | a verbatim v1 stream reads as v2 |
| cp-05 | The resolve action looks generic. | `apps/web/src/routes/plans.$planId.tsx`, Agentation in `DevTools.tsx` | the route and the dev-only toolbar exist |
| cp-06 | Correct code that is wrong. | `scripts/review.sh`, `demo/cp-06-review.md` | the review runs with a different model than the author |
| cp-07 | Released, then changed under real users. | `scripts/deploy.sh`, `scripts/flag.sh`, `just rollback` | the live api returns a version label and id; flags are readable remotely |
| cp-08 | Two people in one plan room. | WebSocket fan-out in `PlanRoom`, the socket proxied by the web Worker, the plan page subscription | a socket on the live web Worker hears an append made through the api (`scripts/ws-check.ts`) |

The planted branch `wrong/cp-02` forks from cp-03: domain vocabulary and tests exist, the first pass still names the event ThreadClosed and makes its own tests pass. cp-02 proves the check catches it; cp-06 proves a second model catches it too.

Build order was 00, 01, 02, 03, 04, 05, 06, 07, 08. Between cp-07 and cp-08 the schema and domain moved from zod to Effect Schema and the api gained Effect services (Flags, PlanRooms, Commands) behind Hono; every earlier tag still passes its demo. The domain decider ships in cp-00 because the api needs it; the tests that explain it come at cp-03.
