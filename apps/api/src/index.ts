import { Hono } from 'hono';
// <cp-05>
import { Schema } from 'effect';
// </cp-05>
import type { Env } from './services';
// <cp-03>
import type { Account } from '@greenhouse/schema';
import { auth } from './auth';
// </cp-03>
// <cp-04>
import { flagsAdmin } from './flags-admin';
import { admin } from './admin';
// </cp-04>
// <cp-05>
import { Effect } from 'effect';
import { Commands, PlanRooms, readiness, runtimeFor } from './services';
import { PlanRoom } from './plan-room';
import { rateLimit, requireSignIn } from './auth';
export { PlanRoom };
// </cp-05>
// <cp-10>
import { Flags } from './services';
// </cp-10>

// Stage markers (<cp-NN> … </cp-NN>) say which workshop stage adds the code between them; the stage branches are
// built from main by keeping only what each stage has. On main they are plain comments.

// Hono is the edge: routing, status codes, JSON. Everything behind it is an Effect program run through one runtime per env.
// What a handler can read off the request: the signed-in account, once sign-in exists.
type RequestVars =
  // <cp-03>
  { account: Account } &
  // </cp-03>
  Record<never, never>;
const app = new Hono<{ Bindings: Env; Variables: RequestVars }>();
// <cp-05>
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
// </cp-05>

// Health: public, dumb. `label` is what a person reads (git describe, passed in at deploy); `id` is what rollback needs.
app.get('/healthz', (c) => c.json({ ok: true, version: { label: c.env.GIT_DESCRIBE ?? 'dev', id: c.env.VERSION?.id ?? 'dev', tag: c.env.VERSION?.tag ?? '' }, at: new Date().toISOString() }));

// Readiness: touch each dependency and name the one that fails. Each stage adds the check for what it depends on.
app.get('/readyz', async (c) => {
  try {
    const checks: Record<string, string> = {};
    await c.env.DB.prepare('SELECT 1').first();
    checks.d1 = 'ok';
    // <cp-03>
    checks.accounts = await c.env.DB.prepare('SELECT count(*) AS n FROM accounts').first<{ n: number }>().then((r) => `ok, ${r?.n ?? 0} accounts`, () => 'not migrated: apply 0002_accounts');
    // </cp-03>
    // <cp-05>
    const room = await runtimeFor(c.env).runPromise(readiness.pipe(Effect.catchTag('NotReady', (e) => Effect.succeed({ planRoom: `not ready: ${e.message}`, version: -1 }))));
    checks.planRoom = room.planRoom;
    // </cp-05>
    const ok = Object.values(checks).every((v) => v.startsWith('ok'));
    return c.json({ ok, ...checks }, ok ? 200 : 503);
  } catch (e) {
    return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 503);
  }
});
// <cp-05>

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

// </cp-05>
// <cp-06>
// Sessions: a signed-in Participant starts, joins, asks, steers. `by` is the signed-in account; the body never sets it.
app.post('/plans/:planId/sessions', byAccount, async (c) => {
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

// </cp-06>
// <cp-10>
// Which flags are on for a participant: what the screen asks before it offers a flagged action. Same Flags service
// decide() reads, so the screen and the domain never disagree. Names only, no allowlists.
app.get('/participants/:participant/flags', async (c) => {
  const participant = planId(c.req.param('participant'));
  const on = await runtimeFor(c.env).runPromise(Flags.use((f) => f.enabledFor(participant)));
  return c.json({ participant, on });
});

// </cp-10>
// <cp-05>
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

// </cp-05>
// <cp-03>
// Identity: POST /auth/sign-up, /auth/sign-in, /auth/sign-out, GET /auth/me.
app.route('/auth', auth);

// </cp-03>
// <cp-04>
// Flags admin: list and set the D1 flags that `decide()` reads. GET /flags, PUT /flags/:name. Admins only.
app.route('/flags', flagsAdmin);

// Admin dashboard: GET /admin/summary, /admin/accounts, /admin/events. Admins only.
app.route('/admin', admin);
// </cp-04>

app.notFound((c) => c.json({ error: 'not found' }, 404));
app.onError((e, c) => {
  console.error(JSON.stringify({ message: 'request failed', path: c.req.path, error: e.message }));
  return c.json({ error: 'internal' }, 500);
});

export default app;
