# Checkpoints

Each checkpoint is a git tag. Each has one deterministic beat (`just demo cp-NN`) that fails before the checkpoint's file exists and passes after, so the show works even when the live agent behaves. The live agent run is the second layer, with `demo/cp-NN.md` holding a recorded transcript as the fallback.

| Tag | Beat shown live | File that fixes it | `just demo` checks |
|---|---|---|---|
| cp-00 | Fresh clone, nobody at the keyboard. `just up`, `/healthz`, `/login`. | justfile, flake.nix | api answers `/healthz` and `/readyz`, web serves `/login` |
| cp-01 | "Add resolve thread." Agent names it ThreadClosed. | `docs/GLOSSARY.md` + ddd-vocabulary | `check-glossary.sh` fails on branch `wrong/cp-01`, passes on tag |
| cp-02 | Agent writes a unit test with a mock. | testing rules + expect harness | `bun test` runs the Thread decider snapshots, read as prose |
| cp-03 | Agent edits a recorded event's shape in place. | event-sourcing skill + upcaster | the v1 → v2 upcaster expect test passes; replay of a seeded stream matches |
| cp-04 | `/create_plan GH-12` returns a wall of Markdown. | viz-explainer decision report | `just artifact` builds `docs/decisions/gh-12.html` and validates every step |
| cp-05 | The resolve action looks generic. | impeccable + animate + Agentation | web `/plans/:id` resolves a thread through the API; Agentation toolbar present in dev |
| cp-06 | Correct code that is wrong. | `just review` with the other model | review on `wrong/cp-01` names ThreadClosed against the glossary |
| cp-07 | Released, then changed under real users. | flag + Workers version rollback | runs on the check-in Worker: `just flag`, `wrangler versions` |

Order of building: 00, 02, 01, 03, 04, 06, 05, 07. The domain comes before the glossary beat because the glossary check needs declared commands to check.
