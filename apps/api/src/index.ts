import { Hono } from 'hono';
import { Effect, Schema } from 'effect';
import { Commands, PlanRooms, readiness, runtimeFor, type Env } from './services';
import { PlanRoom } from './plan-room';

export { PlanRoom };

// Hono is the edge: routing, status codes, JSON. Everything behind it is an Effect program run through one runtime per env.
const app = new Hono<{ Bindings: Env }>();
const planId = Schema.decodeUnknownSync(Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(64)));

// Health: public, dumb. `label` is what a person reads (git describe, passed in at deploy); `id` is what rollback needs.
app.get('/healthz', (c) => c.json({ ok: true, version: { label: c.env.GIT_DESCRIBE ?? 'dev', id: c.env.VERSION?.id ?? 'dev', tag: c.env.VERSION?.tag ?? '' }, at: new Date().toISOString() }));

// Readiness: D1 and one Durable Object, through the services.
app.get('/readyz', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').first();
    const r = await runtimeFor(c.env).runPromise(readiness.pipe(Effect.catchTag('NotReady', (e) => Effect.succeed({ planRoom: `not ready: ${e.message}`, version: -1 }))));
    return c.json({ ok: r.version >= 0, d1: 'ok', ...r }, r.version >= 0 ? 200 : 503);
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

app.get('/plans/:planId/events', async (c) => {
  const id = planId(c.req.param('planId'));
  return c.json(await runtimeFor(c.env).runPromise(PlanRooms.use((r) => r.events(id))));
});

app.get('/plans/:planId', async (c) => {
  const id = planId(c.req.param('planId'));
  return c.json(await runtimeFor(c.env).runPromise(PlanRooms.use((r) => r.read(id))));
});

app.notFound((c) => c.json({ error: 'not found' }, 404));
app.onError((e, c) => {
  console.error(JSON.stringify({ message: 'request failed', path: c.req.path, error: e.message }));
  return c.json({ error: 'internal' }, 500);
});

export default app;
