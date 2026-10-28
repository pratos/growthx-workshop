# The stack: eleven stages, one pull request each

`main` is the finished product. The workshop rebuilds it as a stack of branches, `cp-00` to `cp-10`: each is the one before plus one thing that is implemented and can be demoed. Every branch has a draft pull request against the one below it, so the PR shows exactly that stage's change, and its description is the stage's plan. The stack starts from `stack-base`, a README.

**To build a stage yourself:** check out the stage before it, open its plan for the next one (`docs/plans/stages/cp-NN-*.plan.html`, carried on the branch before), implement it with your own agent, then compare with the stage's PR. `just step N` opens stage N in a worktree of its own, prints what it added, and runs its demo.

| Branch | Stage | What you can demo | Plan |
|---|---|---|---|
| `cp-00-scaffold` | Scaffold and skills, running locally | `just up`; `/healthz` on both Workers through the binding; `just agent-ready` lists what is missing | `cp-00-scaffold` |
| `cp-01-first-deploy` | First deploy of web and API | push to `main`, GitHub deploys, the live `/healthz` shows the version; roll back | `cp-01-first-deploy` |
| `cp-02-design` | Vocabulary, architecture and event design | the map and the agent-loop decision report; the vocabulary check rejects a banned word | `cp-02-design` |
| `cp-03-engine-identity` | Event-sourcing engine; sign-up and sign-in | sign up in the browser; read the sign-up story | `cp-03-engine-identity` |
| `cp-04-admin` | Admin workflows and the first browser test | the dashboard and the masked event log; a participant refused; `just e2e admin` | `cp-04-admin` |
| `cp-05-plan-document` | The plan document: comments to decisions, live | two tabs, one thread; the check and a second model catch ThreadClosed | `cp-05-plan-document` |
| `cp-06-sessions-agent` | Chat with the agent | ask in a session; `just agent-serve` answers through pi-durable | `cp-06-sessions-agent` |
| `cp-07-ui` | UI and UX with Impeccable, Emil's skill and Agentation | before and after of the plan page; one Agentation note fixed live | `cp-07-ui` |
| `cp-08-agent-failures` | The agent's failures as expect tests | the failing-agent stories; `just test` | `cp-08-agent-failures` |
| `cp-09-e2e` | End-to-end tests across the product | `just e2e`: seven tests in a real browser | `cp-09-e2e` |
| `cp-10-release` | Release behind a flag | Resolve appears for you in production without a deploy, and goes again | `cp-10-release` |

**How the branches are made.** From `main`, by taking out what later stages add. Code that a stage adds sits between markers on `main` (`// <cp-05>` … `// </cp-05>`); a few files a later stage rewrote keep their earlier version. Each branch regenerates its own lockfile, Worker types, route tree and architecture map, and passes, in its own worktree: a frozen install, lint, its tests, the vocabulary check (from cp-02), the map, the Worker types, a clean tree, and its demo (`scripts/demo.sh cp-NN`).
