# Deploying

Two sites, two ways in.

| Site | What runs there | How it gets there | Workers · database |
|---|---|---|---|
| **greenhouse.tarp.sh** | the finished product | by hand, from the last stage branch `cp-10-release`: `just deploy prod` | `greenhouse-web`, `greenhouse-api` · D1 `greenhouse` |
| **greenhouse-demo.tarp.sh** | `main` as the workshop merges the stage PRs into it | GitHub Actions, on every push to `main`: `scripts/deploy.sh demo` | `greenhouse-demo-web`, `greenhouse-demo-api` · D1 `greenhouse-demo` |

The web Worker serves the domain; it reaches its own API over the service binding, and `/api/*` on the domain is the API for curl and the agent. A deploy never applies a migration: a deploy with one pending stops and lists it.

## What GitHub runs

| Event | Jobs | What happens |
|---|---|---|
| Push to any branch, every PR | `check` | Frozen install, lint and typecheck, the tests, the architecture map, the generated Worker types, and a guard that refuses a migration with `drop` or `rename` unless the commit message says `ALLOW_DESTRUCTIVE`. |
| Pull request | `check`, `preview` | Uploads both demo Workers as new versions tagged `pr-<number>`, with no traffic. Skipped with a notice if there is no Cloudflare token. |
| Push to `main` | `check`, `deploy` | Deploys `main` to greenhouse-demo.tarp.sh, then checks `https://greenhouse-demo.tarp.sh/healthz`. Any failure fails the job. |
| Actions → deploy → Run workflow | `check`, `migrate` | Lists, then applies, the demo database's pending migrations. |

`deploy` and `migrate` run in the GitHub `production` environment, so you can require your approval before either runs.

## One-time setup

1. **A Cloudflare API token for GitHub.** dash.cloudflare.com → My Profile → API Tokens → Create Token → the *Edit Cloudflare Workers* template, plus **Account · D1 · Edit** and **Zone · Workers Routes · Edit** for `tarp.sh` (custom domains). Copy it once.
2. **Store it in the repository.** `gh` asks for the value and never echoes it:
   ```sh
   gh secret set CLOUDFLARE_API_TOKEN -R pratos/growthx-workshop
   ```
   `CLOUDFLARE_ACCOUNT_ID` is already set.
3. **Optional: a reviewer gate.** Settings → Environments → `production` → Required reviewers → you.
4. **The databases exist**: `greenhouse` (finished site) and `greenhouse-demo` (demo site), both named in `apps/api/wrangler.jsonc`. On a new account, create each with `cd apps/api && bunx wrangler d1 create <name>` and put its id in that file.

## The finished site, greenhouse.tarp.sh

From the last stage, by hand, in this order:

```sh
git checkout cp-10-release && just install
just migrate-remote prod                                   # read the list, then it applies them
just deploy prod                                           # api, then web on greenhouse.tarp.sh, then the smoke check
GH_REMOTE=1 just user-add you@example.com "Your Name" admin   # asks for your password; prod has no seeded accounts
GH_REMOTE=1 just flag user resolve-thread <your id>        # Resolve, for you first
```

The agent there signs in like anyone else: `GH_REMOTE=1 just user-add agent@yourdomain "Agent" member`, then `GREENHOUSE_URL=https://greenhouse.tarp.sh/api AGENT_EMAIL=… AGENT_PASSWORD=… just agent-serve` (with `ANTHROPIC_API_KEY` set for real answers).

## The demo site, greenhouse-demo.tarp.sh

Merge the stage PRs into `main` in order; each merge deploys. Before the merges that add migrations, apply them to the demo database (Actions → deploy → Run workflow, or `just migrate-remote demo`):

| Merge | Needs first |
|---|---|
| cp-01 (deploy) | the token secret (setup step 2) |
| cp-03 (accounts) | `just migrate-remote demo` for `0002_accounts`, then after the merge `GH_REMOTE=1 GH_ENV=demo just user-add …` for your login |
| cp-04 (admin) | `just migrate-remote demo` for `0001_flags_and_projections`; make your demo account an admin with `user-add … admin` |
| cp-05 to cp-10 | nothing new; flags with `GH_REMOTE=1 GH_ENV=demo just flag …` |

## Every change after that

- Flag off first, in seconds and with no deploy: `GH_REMOTE=1 just flag off NAME` (add `GH_ENV=demo` for the demo site).
- Then the previous version: `just rollback api <version-id> prod` (or `demo`), same for `web`. `/healthz` shows the live `version.id`; `cd apps/api && bunx wrangler deployments list` lists earlier ones.
- A new migration ships in its own PR and is applied by hand before the PR that needs it.

## When a job fails

| Message | Meaning | Fix |
|---|---|---|
| `set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID` | The repository has no Cloudflare token. | Setup step 2. |
| `could not list remote D1 migrations` | The token cannot read D1, or the account is wrong. | Add D1 · Edit to the token. |
| `N D1 migration(s) pending on remote. Deploy stopped.` | A migration is committed but not applied to that site's database. | `just migrate-remote demo` (or `prod`). |
| `destructive migration needs ALLOW_DESTRUCTIVE` | A migration drops or renames something. | Ship it a release after the code stops using the old shape, and say `ALLOW_DESTRUCTIVE` in the commit message. |
| `smoke failed` | The site did not answer `/healthz` after the deploy. | A new custom domain can take a minute; run it again. Then `bunx wrangler tail greenhouse-demo-api`. |
| `lockfile had changes, but lockfile is frozen` | `bun.lock` is out of date. | `bun install` locally and commit `bun.lock`. |
