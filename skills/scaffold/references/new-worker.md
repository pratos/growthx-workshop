# Adding a Worker

First ask whether it should be a Worker at all. A Worker earns its own folder when it needs its own deploy, its own domain or dependencies the api must not carry (`apps/checkin` is the example). Otherwise it is a route in `apps/api`. If it is a Worker, do the steps in this order. Each step names the file it touches.

## 1. Folder and package

```
apps/<name>/
├── package.json
├── tsconfig.json
├── wrangler.jsonc
├── src/index.ts
├── worker-configuration.d.ts   generated in step 5
└── migrations/                 only if it owns a D1 database
```

`package.json`, matching `apps/api`:

```json
{
  "name": "@greenhouse/<name>",
  "private": true,
  "type": "module",
  "scripts": { "dev": "wrangler dev", "deploy": "wrangler deploy", "types": "wrangler types" },
  "dependencies": { "hono": "^4.10.0", "effect": "<current>" }
}
```

Add `@greenhouse/schema` or `@greenhouse/domain` as `workspace:*` only if the ARCHITECTURE.md edges table allows that edge (step 6).

`tsconfig.json`: extend the base, point `types` at the generated file, nothing else.

```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "types": ["./worker-configuration.d.ts", "bun-types"] }, "include": ["src", "test", "worker-configuration.d.ts"] }
```

## 2. wrangler.jsonc

Every field below must be present. Copy the values from `apps/api/wrangler.jsonc` so the two Workers agree.

```jsonc
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "greenhouse-<name>",                 // deployed name; the service binding in other Workers uses it
  "main": "src/index.ts",
  "compatibility_date": "2026-10-20",          // same date as api and web; bump all three together
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true, "logs": { "enabled": true, "head_sampling_rate": 1 }, "traces": { "enabled": true, "head_sampling_rate": 0.1 } },
  "version_metadata": { "binding": "VERSION" }, // gives /healthz the version id that `just rollback` needs
  "vars": { "GIT_DESCRIBE": "dev" },           // overwritten at deploy by scripts/deploy.sh with `git describe`
  // bindings this Worker actually uses, one of each kind it depends on:
  // "d1_databases": [{ "binding": "DB", "database_name": "...", "database_id": "...", "migrations_dir": "migrations" }],
  // "services": [{ "binding": "API", "service": "greenhouse-api" }],
  // "durable_objects": { "bindings": [{ "name": "...", "class_name": "..." }] }, "migrations": [{ "tag": "v1", "new_sqlite_classes": ["..."] }],
  // "routes": [{ "pattern": "<host>", "custom_domain": true }]   // only for a Worker with its own domain
}
```

Rules for the file: no secret in `vars` (a secret goes in with `bunx wrangler secret put NAME`, run by the person); `workers_dev` only if it should answer on the default subdomain; a `--env` block (`"env": { "staging": {...} }`) only when `just deploy staging` is going to be used for it.

## 3. `/healthz` and `/readyz`

Both public. `/healthz` is dumb and never touches a dependency. `/readyz` touches every binding the Worker needs and answers 503 if any fails. Use the generated `Env`, not a hand-written type.

```ts
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

// Health: public, dumb. `label` is for people (git describe, passed in at deploy); `id` is what `just rollback` needs.
app.get('/healthz', (c) =>
  c.json({ ok: true, version: { label: c.env.GIT_DESCRIBE ?? 'dev', id: c.env.VERSION?.id ?? 'dev', tag: c.env.VERSION?.tag ?? '' }, at: new Date().toISOString() }));

// Readiness: one line per dependency. Add a line when you add a binding.
app.get('/readyz', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').first();                      // D1
    // await c.env.API.fetch('https://api/healthz');                 // a service binding: call the upstream /healthz
    // await c.env.SOME_DO.getByName('readyz').version();             // a Durable Object: a cheap read
    return c.json({ ok: true, d1: 'ok' });
  } catch (e) {
    return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 503);
  }
});

app.notFound((c) => c.json({ error: 'not found' }, 404));
app.onError((e, c) => {
  console.error(JSON.stringify({ message: 'request failed', path: c.req.path, error: e.message }));
  return c.json({ error: 'internal' }, 500);
});

export default app;
```

In `apps/web` the same two routes are file routes with `server.handlers` (`src/routes/healthz.ts` is the model). Its `/readyz` calls the api's `/readyz` through `env.API` and reports both. Hono handles the request; anything with logic behind the handler is an Effect program run with a Layer that wraps the bindings.

## 4. Logs and traces

The `observability` block above is the whole setting: logs on at 100%, traces on at 10%. Log one JSON object per line (`console.error(JSON.stringify({...}))`), never a secret, never a request body. Nothing else to install.

## 5. Generated types

```sh
cd apps/<name> && bunx wrangler types
```

Commit `worker-configuration.d.ts`. CI runs the same command and fails on a diff, so every binding change is followed by this. Do not declare `Env`, `Bindings` or a `type Env = {...}` anywhere by hand.

## 6. Boundary and edges

- Add a row to the allowed-edges table in `docs/ARCHITECTURE.md` and a node in the diagram above it, in the same commit.
- If the Worker must not reach the domain or a database (anything on the web side), add an override block to `.oxlintrc.json` for `apps/<name>/**` copied from the `apps/web/**` one.
- `packages/*` never import from `apps/*`.

## 7. justfile

Add in this order, each with a comment line:

- A dev recipe if the Worker runs on its own: the `checkin action:` recipe is the pattern (`cd apps/<name> && bunx wrangler {{action}}`). A Worker that `just up` must start is added to `auxiliaryWorkers` in `apps/web/vite.config.ts` instead.
- `lint`: add `bunx tsc -p apps/<name>/tsconfig.json --noEmit`.
- `test`: add `apps/<name>` to the `bun test` line if it has tests.
- If it owns a D1: a `migrate-local` line and a `seed` line for its database.

## 8. Deploy order

`scripts/deploy.sh` deploys api, then web. Insert the new Worker after every Worker it binds to and before every Worker that binds to it. Reuse the same line shape so it gets the `GIT_DESCRIBE` label and the grep on `Deployed|Version ID`. A Worker with its own release cadence (checkin) stays out of `deploy.sh` and gets its own recipe. Add the Worker to the `rollback` recipe's comment.

## 9. CI job

`.github/workflows/deploy.yml`:

- `check`: nothing to add if `bun run lint` and `just lint` cover the new tsconfig. Add a `wrangler types && git diff --exit-code` step for the new folder next to the api one.
- `preview`: add `cd apps/<name> && bunx wrangler versions upload --tag "pr-${{ github.event.number }}"`.
- `deploy`: already runs `scripts/deploy.sh`. Add a smoke line: `curl -sf "https://greenhouse-<name>.${{ vars.WORKERS_SUBDOMAIN }}.workers.dev/healthz" | jq -e '.ok == true'`.
- `migrate`: add list and apply lines for the new database if it owns one. Manual trigger stays the only way.

## 10. Docs and the runbook

- `README.md`: one row in the Where/What table.
- `docs/RUNBOOK.md`: the live URL under "Live".
- `docs/ARCHITECTURE.md`: done in step 6.

## 11. Prove it

```sh
just lint && just test
just up                                   # or: just <name> dev
curl -s localhost:8787/healthz | jq .version
curl -s localhost:8787/readyz | jq .ok
cd tools/twelve-factor-baml && baml run main -- ../../apps/<name>   # twelve-factor; wrap it in a `just` recipe before the second run
```

Then the `Next:` line. For a new Worker it is usually: "Next: `just deploy`, check `/healthz` on the deployed URL, then wire the first real route behind a flag."
