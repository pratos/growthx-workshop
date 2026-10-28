# Deploying from GitHub

Greenhouse deploys with GitHub Actions (`.github/workflows/deploy.yml`) to Cloudflare Workers: the API Worker first, then the web Worker. The same script runs on your laptop as `just deploy`, so a deploy behaves the same in both places. Migrations are never applied by a deploy; you apply them by hand, and a deploy with one pending stops.

## What runs when

| Event | Jobs | What happens |
|---|---|---|
| Push to any branch, every PR | `check` | Frozen install, lint and typecheck, all tests, the architecture map, the generated Worker types, and a guard that refuses a migration with `drop` or `rename` unless the commit message says `ALLOW_DESTRUCTIVE`. |
| Pull request | `check`, `preview` | Uploads both Workers as new versions tagged `pr-<number>`, with no traffic. Skipped with a notice if the repo has no Cloudflare secrets. |
| Push to `main` | `check`, `deploy` | `scripts/deploy.sh`: stops if a D1 migration is pending, deploys the API then the web Worker labelled with `git describe`, then checks `/healthz` on the live API. Any failure fails the job. |
| Actions → deploy → Run workflow | `check`, `migrate` | Lists the pending D1 migrations, then applies them. The only way CI changes the database. |

`deploy` and `migrate` run in the `production` environment, so you can require an approval before either touches production (step 4 below).

## One-time setup

1. **Create a Cloudflare API token** at dash.cloudflare.com → My Profile → API Tokens → Create Token. Start from the *Edit Cloudflare Workers* template and add **Account · D1 · Edit**. Limit it to your account. Copy it once; Cloudflare will not show it again.
2. **Find your account ID and workers.dev subdomain**: Workers & Pages → Overview shows both. The subdomain is the part in `greenhouse-api.<subdomain>.workers.dev`.
3. **Store them in the repository.** `gh` asks for each secret's value and never echoes it; nothing lands in your shell history or this repo.
   ```sh
   gh secret set CLOUDFLARE_API_TOKEN  -R pratos/growthx-workshop
   gh secret set CLOUDFLARE_ACCOUNT_ID -R pratos/growthx-workshop
   gh variable set WORKERS_SUBDOMAIN --body <your-subdomain> -R pratos/growthx-workshop
   ```
4. **Optional, recommended: a reviewer gate.** Settings → Environments → `production` → Required reviewers → add yourself. Every deploy and migration then waits for your click.
5. **Check the D1 database belongs to that account.** `apps/api/wrangler.jsonc` names the database `greenhouse` with its id. On a fresh account, create it once with `cd apps/api && bunx wrangler d1 create greenhouse` and put the new id in `wrangler.jsonc`.

## The first deploy, in order

1. **Apply the migrations.** Actions → deploy → Run workflow on `main` (or `just migrate-remote` locally). Read the list it prints: every migration here only adds tables.
2. **Deploy.** Push to `main`, or re-run the failed `deploy` job. The job ends by printing the live version: `{"label": "…", "id": "…"}`.
3. **Add yourself as an admin.** Production has no seeded accounts; seeds are local only.
   ```sh
   GH_REMOTE=1 just user-add you@example.com "Your Name" admin   # asks for the password
   ```
4. **Turn a feature on for yourself first**: `GH_REMOTE=1 just flag user resolve-thread <your participant id>`. Then `docs/RELEASE.md` for widening it.

## Every deploy after that

- A PR runs `check` and uploads a preview version. Merging to `main` deploys.
- A new migration ships in its own PR, applied by hand (step 1 above) before the PR that needs it is merged. A deploy with a migration pending stops and lists it.
- To roll back: flag off first (`GH_REMOTE=1 just flag off NAME`, seconds, no deploy), then the previous version: `just rollback api <version-id>`, same for `web`. `/healthz` shows the live `version.id`; `cd apps/api && bunx wrangler deployments list` shows earlier ones.

## When a job fails

| Message | Meaning | Fix |
|---|---|---|
| `set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID` | The repository has no Cloudflare secrets. | Setup step 3. |
| `could not list remote D1 migrations` | The token cannot read D1, or the account is wrong. | Add D1 · Edit to the token; check `CLOUDFLARE_ACCOUNT_ID`. |
| `N D1 migration(s) pending on remote. Deploy stopped.` | A migration is committed but not applied. | First deploy, step 1. |
| `destructive migration needs ALLOW_DESTRUCTIVE` | A migration drops or renames something. | Ship it a release after the code stops using the old shape, and say `ALLOW_DESTRUCTIVE` in the commit message. |
| `smoke failed` | The API did not answer `/healthz` after the deploy. | Check `WORKERS_SUBDOMAIN`; then `bunx wrangler tail greenhouse-api`. |
| `lockfile had changes, but lockfile is frozen` | `bun.lock` is out of date. | Run `bun install` locally and commit `bun.lock`. |
