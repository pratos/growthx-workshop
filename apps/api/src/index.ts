import { Hono } from 'hono';
import { Schema } from 'effect';
import type { Env } from './services';
import type { Account } from '@greenhouse/schema';
import { auth } from './auth';
import { flagsAdmin } from './flags-admin';
import { admin } from './admin';
import { Effect } from 'effect';
import { Commands, PlanRooms, readiness, runtimeFor } from './services';
import { PlanRoom } from './plan-room';
import { rateLimit, requireSignIn } from './auth';
export { PlanRoom };

// Stage markers (<cp-NN> … </cp-NN>) say which workshop stage adds the code between them; the stage branches are
// built from main by keeping only what each stage has. On main they are plain comments.

// Hono is the edge: routing, status codes, JSON. Everything behind it is an Effect program run through one runtime per env.
// What a handler can read off the request: the signed-in account, once sign-in exists.
type RequestVars =
  { account: Account } &
  Record<never, never>;
const app = new Hono<{ Bindings: Env; Variables: RequestVars }>();
const planId = Schema.decodeUnknownSync(Schema.String.check(Schema.isPattern(/^[a-z0-9][a-z0-9-]{0,39}$/)));
// Plan rooms are Durable Objects, billed per request and while awake, and the first touch of a new id creates one.
// So only a signed-in Participant reaches a room, by a short lowercase id, and writes are rate-limited per account.
const PLAN_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
const roomGuard = async (c: { req: { param(k: 'planId'): string } }, next: () => Promise<void>) =>
  PLAN_ID.test(c.req.param('planId')) ? next() : undefined;
const byAccount = rateLimit('WRITE_LIMIT', (c) => `account:${c.get('account')?.accountId ?? 'none'}`);
app.use('/plans/:planId', requireSignIn);
app.use('/plans/:planId/*', requireSignIn);
app.use('/plans/:planId/*', async (c, next) => (await roomGuard(c, next)) ?? c.json({ rejected: 'a plan id is 1 to 40 lowercase letters, digits or dashes' }, 400));
app.use('/plans/:planId', async (c, next) => (await roomGuard(c, next)) ?? c.json({ rejected: 'a plan id is 1 to 40 lowercase letters, digits or dashes' }, 400));

// Health: public, dumb. `label` is what a person reads (git describe, passed in at deploy); `id` is what rollback needs.
app.get('/healthz', (c) => c.json({ ok: true, version: { label: c.env.GIT_DESCRIBE ?? 'dev', id: c.env.VERSION?.id ?? 'dev', tag: c.env.VERSION?.tag ?? '' }, at: new Date().toISOString() }));

// Readiness: touch each dependency and name the one that fails. Each stage adds the check for what it depends on.
app.get('/readyz', async (c) => {
  try {
    const checks: Record<string, string> = {};
    await c.env.DB.prepare('SELECT 1').first();
    checks.d1 = 'ok';
    checks.accounts = await c.env.DB.prepare('SELECT count(*) AS n FROM accounts').first<{ n: number }>().then((r) => `ok, ${r?.n ?? 0} accounts`, () => 'not migrated: apply 0002_accounts');
    const room = await runtimeFor(c.env).runPromise(readiness.pipe(Effect.catchTag('NotReady', (e) => Effect.succeed({ planRoom: `not ready: ${e.message}`, version: -1 }))));
    checks.planRoom = room.planRoom;
    const ok = Object.values(checks).every((v) => v.startsWith('ok'));
    return c.json({ ok, ...checks }, ok ? 200 : 503);
  } catch (e) {
    return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 503);
  }
});

app.post('/plans/:planId/commands', byAccount, async (c) => {
  const id = planId(c.req.param('planId'));
  // `by` is the signed-in account; whatever the body says is ignored, so nobody can write as someone else.
  const raw = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const body = raw && typeof raw === 'object' ? { ...raw, by: c.get('account').accountId } : raw;
  const outcome = await runtimeFor(c.env).runPromise(
    Commands.use((cmds) => cmds.dispatch(id, body)).pipe(
      Effect.map((events) => ({ status: 201 as const, body: { events } })),
      Effect.catchTags({
        InvalidCommand: (e) => Effect.succeed({ status: 400 as const, body: { rejected: `invalid ${e.type}: ${e.message}` } }),
        CommandRejected: (e) => Effect.succeed({ status: 409 as const, body: { rejected: e.reason } }),
      }),
    ),
  );
  return c.json(outcome.body, outcome.status);
});

// Live stream of the plan: the Durable Object accepts the socket and fans out every append.
app.get('/plans/:planId/ws', (c) => {
  const upgrade = new Request(c.req.raw);
  upgrade.headers.set('x-greenhouse-participant', c.get('account').accountId); // set here, after sign-in; never trusted from the client
  return c.env.PLAN_ROOM.getByName(planId(c.req.param('planId'))).fetch(upgrade);
});

app.get('/plans/:planId/events', async (c) => {
  const id = planId(c.req.param('planId'));
  return c.json(await runtimeFor(c.env).runPromise(PlanRooms.use((r) => r.events(id))));
});

// Who is who: participant ids and the names people see (the agent's name included). Signed-in only.
app.get('/participants', requireSignIn, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT account_id, name FROM accounts ORDER BY account_id').all<{ account_id: string; name: string }>();
  return c.json({ participants: results.map((r) => ({ id: r.account_id, name: r.name })) });
});

// The orchestrator: every plan room anyone has opened, newest activity first, with who is in each now.
app.get('/plans', requireSignIn, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT plan_id, opened_by, opened_at, last_active_at, here FROM plans ORDER BY last_active_at DESC LIMIT 100')
    .all<{ plan_id: string; opened_by: string; opened_at: string; last_active_at: string; here: string }>();
  return c.json({ plans: results.map((p) => ({ planId: p.plan_id, openedBy: p.opened_by, openedAt: p.opened_at, lastActiveAt: p.last_active_at, here: JSON.parse(p.here) as string[] })) });
});

app.get('/plans/:planId', async (c) => {
  const id = planId(c.req.param('planId'));
  // Opening a plan registers its room with the orchestrator (first opener and time), then marks it active.
  const now = new Date().toISOString();
  c.executionCtx.waitUntil(c.env.DB.prepare('INSERT INTO plans (plan_id, opened_by, opened_at, last_active_at) VALUES (?1, ?2, ?3, ?3) ON CONFLICT(plan_id) DO UPDATE SET last_active_at = ?3')
    .bind(id, c.get('account').accountId, now).run().then(() => undefined, () => undefined));
  return c.json(await runtimeFor(c.env).runPromise(PlanRooms.use((r) => r.read(id))));
});

// Identity: POST /auth/sign-up, /auth/sign-in, /auth/sign-out, GET /auth/me.
app.route('/auth', auth);

// Flags admin: list and set the D1 flags that `decide()` reads. GET /flags, PUT /flags/:name. Admins only.
app.route('/flags', flagsAdmin);

// Admin dashboard: GET /admin/summary, /admin/accounts, /admin/events. Admins only.
app.route('/admin', admin);

app.notFound((c) => c.json({ error: 'not found' }, 404));
app.onError((e, c) => {
  console.error(JSON.stringify({ message: 'request failed', path: c.req.path, error: e.message }));
  return c.json({ error: 'internal' }, 500);
});

export default app;
