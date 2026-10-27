import { Hono } from 'hono';
import { z } from 'zod';
import { CommandEnvelope } from '@greenhouse/domain';
import { PlanRoom } from './plan-room';

export { PlanRoom };

type Bindings = { DB: D1Database; PLAN_ROOM: DurableObjectNamespace<PlanRoom>; VERSION: { id: string; tag: string } };
const app = new Hono<{ Bindings: Bindings }>();

// Health: public, dumb, carries the version id so rollback is a curl away.
app.get('/healthz', (c) => c.json({ ok: true, version: c.env.VERSION?.id ?? 'dev', at: new Date().toISOString() }));

// Readiness: touches D1 and one Durable Object.
app.get('/readyz', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').first();
    const v = await c.env.PLAN_ROOM.getByName('readyz').version();
    return c.json({ ok: true, d1: 'ok', planRoom: 'ok', version: v });
  } catch (e) {
    return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 503);
  }
});

const planId = z.string().min(1).max(64);

app.post('/plans/:planId/commands', async (c) => {
  const id = planId.parse(c.req.param('planId'));
  const body = CommandEnvelope.safeParse(await c.req.json());
  if (!body.success) return c.json({ rejected: 'invalid command', issues: body.error.issues }, 400);
  const flags = await loadFlags(c.env.DB, body.data.by);
  const room = c.env.PLAN_ROOM.getByName(id);
  const result = await room.dispatch(body.data, flags);
  if ('rejected' in result) return c.json(result, 409);
  return c.json(result, 201);
});

app.get('/plans/:planId/events', async (c) => {
  const id = planId.parse(c.req.param('planId'));
  return c.json(await c.env.PLAN_ROOM.getByName(id).events());
});

app.get('/plans/:planId', async (c) => {
  const id = planId.parse(c.req.param('planId'));
  return c.json(await c.env.PLAN_ROOM.getByName(id).read());
});

app.notFound((c) => c.json({ error: 'not found' }, 404));
app.onError((e, c) => {
  console.error(JSON.stringify({ message: 'request failed', path: c.req.path, error: e.message }));
  return c.json({ error: 'internal' }, 500);
});

// Flags live in one table, read once per request, evaluated inside decide(). Default off.
// Returns plain data: a function would cross the Durable Object RPC boundary as an async stub, and a Promise is always truthy.
async function loadFlags(db: D1Database, participant: string): Promise<string[]> {
  const { results } = await db.prepare('SELECT name, enabled, allowlist, percent FROM flags').all<{ name: string; enabled: number; allowlist: string | null; percent: number }>();
  const on = new Set<string>();
  for (const f of results) {
    if (f.enabled) on.add(f.name);
    else if (f.allowlist && f.allowlist.split(',').map((s) => s.trim()).includes(participant)) on.add(f.name);
    else if (f.percent > 0 && bucket(participant, f.name) < f.percent) on.add(f.name);
  }
  return [...on];
}

// Stable 0..99 bucket per participant and flag, so a percentage rollout is deterministic per person.
function bucket(participant: string, flag: string): number {
  let h = 2166136261;
  for (const ch of `${flag}:${participant}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h % 100;
}

export default app;
