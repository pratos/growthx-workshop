# One task, end to end

A green PR is the middle of the job, not the end. Every change goes through the same nine steps; most of the work that decides whether it lands well is yours, not the agent's.

| # | Step | Who | What it means | How, here |
|---|---|---|---|---|
| 1 | Interview | you | Talk to the person who asked, or who would. Write the feature, not the ask. | One sentence in their words, at the top of the PR |
| 2 | Name it | you | New nouns go in the vocabulary and the schema first. A word with no type stops here. | `docs/DOMAIN-VOCABULARY.md`, `packages/schema`, `just domain-vocabulary-check` |
| 3 | Estimate | you | Coding is about a sixth of the job. Budget the rest for yourself. | A line in the plan's summary |
| 4 | Plan | shared | A page you look at: decisions as reports you click, UI as real components, code only as contracts. | `/create_plan`, then `just plan docs/plans/<file>.plan.json "why"` |
| 5 | Build | agent | Shape first, then the domain with its stories, then the screen with its browser test. | `just new command Name`, `just test`, `just e2e` |
| 6 | Dogfood | you | Use it yourself on real data. A test proves it works; only you can tell if it feels right. | `just up`, `docs/TESTING.md` |
| 7 | Review, inverted | shared | A different model than the author reviews, vocabulary first, then the diff. | `just review main` |
| 8 | Release, staged | you | Switched off, you first, then small steps, with the way back written down. | `docs/RELEASE.md` |
| 9 | Feed it back | shared | What the release taught goes where the next task will find it. | `docs/decisions/`, the skill that would have caught it |

The plan's versions record who changed what and why (`just plan-history FILE`), so step 4 stays traceable as the work moves.
