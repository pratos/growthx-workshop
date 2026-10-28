import { Hono } from 'hono';
import { Effect, Schema } from 'effect';
import { Commands, Flags, PlanRooms, readiness, runtimeFor, type Env } from './services';
import { PlanRoom } from './plan-room';
import { flagsAdmin } from './flags-admin';
import { admin } from './admin';
import { auth, requireSignIn } from './auth';
import type { Account } from '@greenhouse/schema';

export { PlanRoom };

// Hono is the edge: routing, status codes, JSON. Everything behind it is an Effect program run through one runtime per env.
const app = new Hono<{ Bindings: Env; Variables: { account: Account } }>();
const planId = Schema.decodeUnknownSync(Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(64)));

// Health: public, dumb. `label` is what a person reads (git describe, passed in at deploy); `id` is what rollback needs.
app.get('/healthz', (c) => c.json({ ok: true, version: { label: c.env.GIT_DESCRIBE ?? 'dev', id: c.env.VERSION?.id ?? 'dev', tag: c.env.VERSION?.tag ?? '' }, at: new Date().toISOString() }));

// Readiness: D1 and one Durable Object, through the services.
app.get('/readyz', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').first();
    const accounts = await c.env.DB.prepare('SELECT count(*) AS n FROM accounts').first<{ n: number }>().then((r) => `ok, ${r?.n ?? 0} accounts`, () => 'not migrated: apply 0002_accounts');
    const r = await runtimeFor(c.env).runPromise(readiness.pipe(Effect.catchTag('NotReady', (e) => Effect.succeed({ planRoom: `not ready: ${e.message}`, version: -1 }))));
    const ok = r.version >= 0 && accounts.startsWith('ok');
    return c.json({ ok, d1: 'ok', accounts, ...r }, ok ? 200 : 503);
  } catch (e) {
    return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 503);
  }
});

app.post('/plans/:planId/commands', async (c) => {
  const id = planId(c.req.param('planId'));
  const body = await c.req.json().catch(() => null);
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

// Sessions: a signed-in Participant starts, joins, asks, steers. `by` is the signed-in account; the body never sets it.
app.post('/plans/:planId/sessions', requireSignIn, async (c) => {
  const id = planId(c.req.param('planId'));
  const body = (await c.req.json().catch(() => null)) as { type?: unknown; data?: unknown } | null;
  const result = await c.env.PLAN_ROOM.getByName(id).sessionCommand(id, typeof body?.type === 'string' ? body.type : '', body?.data ?? {}, c.get('account').accountId);
  return 'rejected' in result ? c.json(result, 409) : c.json(result, 201);
});

app.get('/plans/:planId/sessions', requireSignIn, async (c) => {
  return c.json({ sessions: await c.env.PLAN_ROOM.getByName(planId(c.req.param('planId'))).sessionList() });
});

app.get('/plans/:planId/sessions/:sessionId', requireSignIn, async (c) => {
  const view = await c.env.PLAN_ROOM.getByName(planId(c.req.param('planId'))).sessionView(c.req.param('sessionId'));
  return view ? c.json(view) : c.json({ error: 'no such session' }, 404);
});

// Which flags are on for a participant: what the screen asks before it offers a flagged action. Same Flags service
// decide() reads, so the screen and the domain never disagree. Names only, no allowlists.
app.get('/participants/:participant/flags', async (c) => {
  const participant = planId(c.req.param('participant'));
  const on = await runtimeFor(c.env).runPromise(Flags.use((f) => f.enabledFor(participant)));
  return c.json({ participant, on });
});

// Live stream of the plan: the Durable Object accepts the socket and fans out every append.
app.get('/plans/:planId/ws', (c) => c.env.PLAN_ROOM.getByName(planId(c.req.param('planId'))).fetch(c.req.raw));

app.get('/plans/:planId/events', async (c) => {
  const id = planId(c.req.param('planId'));
  return c.json(await runtimeFor(c.env).runPromise(PlanRooms.use((r) => r.events(id))));
});

app.get('/plans/:planId', async (c) => {
  const id = planId(c.req.param('planId'));
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
