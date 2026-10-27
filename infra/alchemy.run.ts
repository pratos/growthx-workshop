// Infrastructure as TypeScript, in the same repo as the code it deploys. `just deploy [stage]` runs this.
// Stage: your username locally, pr-<n> on pull requests, prod on main. Each stage is isolated: its own D1, Workers and state.
// Migrations are NOT applied here (no migrationsDir on purpose): `just deploy` stops when one is pending and a person applies it.
import alchemy from 'alchemy';
import { D1Database, DurableObjectNamespace, TanStackStart, Worker } from 'alchemy/cloudflare';

const app = await alchemy('greenhouse');
const stage = app.stage;

const db = await D1Database('db', { name: `greenhouse-${stage}` });

// The plan's event log: one SQLite-backed Durable Object per Plan, defined by the api Worker.
const planRoom = DurableObjectNamespace('plan-room', { className: 'PlanRoom', sqlite: true });

const api = await Worker('api', {
  name: `greenhouse-api-${stage}`,
  entrypoint: 'apps/api/src/index.ts',
  compatibilityDate: '2026-10-20',
  compatibilityFlags: ['nodejs_compat'],
  bindings: { DB: db, PLAN_ROOM: planRoom },
  url: true,
});

// The web Worker reaches the api only through this binding. No database, no public URL in between.
const web = await TanStackStart('web', {
  name: `greenhouse-web-${stage}`,
  cwd: 'apps/web',
  build: 'bun run build',
  bindings: { API: api },
  compatibilityDate: '2026-10-20',
  compatibilityFlags: ['nodejs_compat'],
});

console.log(JSON.stringify({ stage, api: api.url, web: web.url }));
// Postgres option: swap D1Database for Hyperdrive({ origin: process.env.DATABASE_URL }) and bind it as HYPERDRIVE; the api reads
// env.HYPERDRIVE.connectionString. Documented, not default: D1 is the database everywhere in this repo.

await app.finalize();
