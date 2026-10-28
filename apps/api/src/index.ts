import { Hono } from 'hono';
import type { Env } from './services';
import type { Account } from '@greenhouse/schema';
import { auth } from './auth';

// Stage markers (<cp-NN> … </cp-NN>) say which workshop stage adds the code between them; the stage branches are
// built from main by keeping only what each stage has. On main they are plain comments.

// Hono is the edge: routing, status codes, JSON. Everything behind it is an Effect program run through one runtime per env.
// What a handler can read off the request: the signed-in account, once sign-in exists.
type RequestVars =
  { account: Account } &
  Record<never, never>;
const app = new Hono<{ Bindings: Env; Variables: RequestVars }>();

// Health: public, dumb. `label` is what a person reads (git describe, passed in at deploy); `id` is what rollback needs.
app.get('/healthz', (c) => c.json({ ok: true, version: { label: c.env.GIT_DESCRIBE ?? 'dev', id: c.env.VERSION?.id ?? 'dev', tag: c.env.VERSION?.tag ?? '' }, at: new Date().toISOString() }));

// Readiness: touch each dependency and name the one that fails. Each stage adds the check for what it depends on.
app.get('/readyz', async (c) => {
  try {
    const checks: Record<string, string> = {};
    await c.env.DB.prepare('SELECT 1').first();
    checks.d1 = 'ok';
    checks.accounts = await c.env.DB.prepare('SELECT count(*) AS n FROM accounts').first<{ n: number }>().then((r) => `ok, ${r?.n ?? 0} accounts`, () => 'not migrated: apply 0002_accounts');
    const ok = Object.values(checks).every((v) => v.startsWith('ok'));
    return c.json({ ok, ...checks }, ok ? 200 : 503);
  } catch (e) {
    return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 503);
  }
});
// Identity: POST /auth/sign-up, /auth/sign-in, /auth/sign-out, GET /auth/me.
app.route('/auth', auth);


app.notFound((c) => c.json({ error: 'not found' }, 404));
app.onError((e, c) => {
  console.error(JSON.stringify({ message: 'request failed', path: c.req.path, error: e.message }));
  return c.json({ error: 'internal' }, 500);
});

export default app;
