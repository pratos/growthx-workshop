# The stack: eleven stages, one pull request each

`main` is stage cp-00, the scaffold. The workshop builds on it as a stack of branches, `cp-01` to `cp-10`: each is the one before plus one thing that is implemented and can be demoed. Every branch has a draft pull request against the one below it (cp-01's against `main`), so the PR shows exactly that stage's change, and its description is the stage's plan. Merging them into `main` in order grows `main` into the product, and every merge deploys to greenhouse-demo.tarp.sh. `final` is the finished product with the workshop's own material; `cp-10-release` is what runs on greenhouse.tarp.sh.

**To build a stage yourself:** check out the stage before it. Its `.stage` file names the next stage, `just next` prints that plan, and `docs/plans/stages/cp-NN-*.plan.html` shows it as a page. Build it with your own agent: a hook keeps the agent to the files the plan lists, and `just stage-check` runs the plan's checks. Then compare with the stage's PR. `just step N` opens stage N in a worktree of its own, prints what it added, and runs its demo.

| Branch | Stage | What you can demo | Plan |
|---|---|---|---|
| `main` | Scaffold and skills, running locally | `just up`; `/healthz` on both Workers through the binding; `just agent-ready` lists what is missing | `cp-00-scaffold` |
| `cp-01-first-deploy` | First deploy of web and API | merge into `main`; GitHub deploys greenhouse-demo.tarp.sh, whose `/healthz` shows the version; roll back | `cp-01-first-deploy` |
| `cp-02-design` | Vocabulary, architecture and event design | the map and the agent-loop decision report; the vocabulary check rejects a banned word | `cp-02-design` |
| `cp-03-engine-identity` | Event-sourcing engine; sign-up and sign-in | sign up in the browser; read the sign-up story | `cp-03-engine-identity` |
| `cp-04-admin` | Admin workflows and the first browser test | the dashboard and the masked event log; a participant refused; `just e2e admin` | `cp-04-admin` |
| `cp-05-plan-document` | The plan document: comments to decisions, live | two tabs, one thread; the check and a second model catch ThreadClosed | `cp-05-plan-document` |
| `cp-06-sessions-agent` | Chat with the agent | ask in a session; `just agent-serve` answers through pi-durable | `cp-06-sessions-agent` |
| `cp-07-ui` | UI and UX with Impeccable, Emil's skill and Agentation | before and after of the plan page; one Agentation note fixed live | `cp-07-ui` |
| `cp-08-agent-failures` | The agent's failures as expect tests | the failing-agent stories; `just test` | `cp-08-agent-failures` |
| `cp-09-e2e` | End-to-end tests across the product | `just e2e`: seven tests in a real browser | `cp-09-e2e` |
| `cp-10-release` | Release behind a flag | `just deploy prod` to greenhouse.tarp.sh; Resolve appears for you without a deploy, and goes again | `cp-10-release` |

**How the branches are made.** From `final`, by taking out what later stages add. Code that a stage adds sits between markers on `final` (`// <cp-05>` … `// </cp-05>`); a few files a later stage rewrote keep their earlier version. Each branch regenerates its own lockfile, Worker types, route tree and architecture map, and passes, in its own worktree: a frozen install, lint, its tests, the vocabulary check (from cp-02), the map, the Worker types, a clean tree, and its demo (`scripts/demo.sh cp-NN`).

## Setup, stage by stage

What each stage needs on your machine, in the cloud, and in the database before its demo works. Local logins are in `.dev.vars.example`; nothing here is ever pasted into chat.

| Stage | On your machine | Secrets and keys | Database | Where it runs |
|---|---|---|---|---|
| cp-00 | Nix (`nix develop` or direnv), then `just install`, `just up` | none | none yet: `/readyz` only checks it is reachable | localhost:3000 |
| cp-01 | `gh auth login`; `bunx wrangler login` | GitHub: `gh secret set CLOUDFLARE_API_TOKEN` (`docs/DEPLOY.md`, setup 1 and 2) | none yet | merge into `main` → greenhouse-demo.tarp.sh |
| cp-02 | nothing new | none | none | local; the plans and the decision report are pages |
| cp-03 | `just reset` (migrates and seeds the admin, Sam and the agent locally) | none | demo: `just migrate-remote demo` (0002 accounts), then `GH_REMOTE=1 GH_ENV=demo just user-add you@… "You" member` | demo site: sign up |
| cp-04 | `just e2e-install` (Chromium for Playwright) | none | demo: `just migrate-remote demo` (0001 flags); `GH_REMOTE=1 GH_ENV=demo just user-add you@… "You" admin` | demo site: `/admin` |
| cp-05 | `just reset` (adds the `resolve-thread` flag) | Claude Code or pi signed in, for `just review` | demo: `GH_REMOTE=1 GH_ENV=demo just flag user resolve-thread <you>` | demo site: `/plans/gh-12` |
| cp-06 | `just agent-serve` in a second terminal | optional `ANTHROPIC_API_KEY` (or OpenAI) in that shell for real answers; without one a faux model answers | none new | demo site; the agent against it: `GREENHOUSE_URL=https://greenhouse-demo.tarp.sh/api` plus an agent account made with `user-add` |
| cp-07 | `just up`; the Agentation toolbar shows in dev | none | none | demo site |
| cp-08 | nothing new | none | none | `just test` |
| cp-09 | `just e2e-install` once | none | none | `just e2e` locally |
| cp-10 | `bunx wrangler login` | none new | finished site: `just migrate-remote prod` | `just deploy prod` → greenhouse.tarp.sh; `GH_REMOTE=1 just user-add …` and `GH_REMOTE=1 just flag user resolve-thread <you>` |
