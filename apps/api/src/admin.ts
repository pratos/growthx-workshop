import { Hono } from 'hono';
import { Effect, Schema } from 'effect';
import type { Account } from '@greenhouse/schema';
import { Accounts } from '@greenhouse/domain';
import { requireAdmin, run } from './auth';
import type { Env } from './services';

// The admin dashboard's API: counts, accounts, and the event log itself. Admins only, like the flags.
// Every admin screen is an API first, so an agent with an admin sign-in can do what the page does.

export const admin = new Hono<{ Bindings: Env; Variables: { account: Account } }>();
admin.use('*', requireAdmin);

// Secrets never leave the API, not even to an admin: a hash prints as •••, so the log still shows one was recorded.
const SECRET = /hash|password|token/i;
const mask = (data: unknown): unknown =>
  Object.fromEntries(Object.entries((data ?? {}) as Record<string, unknown>).map(([k, v]) => [k, SECRET.test(k) ? '•••' : v]));

const count = async (db: D1Database, sql: string, ...params: unknown[]) =>
  Number((await db.prepare(sql).bind(...params).first<{ n: number }>())?.n ?? 0);

admin.get('/summary', async (c) => {
  const db = c.env.DB, now = new Date().toISOString();
  const [accounts, admins, signIns, flags, flagsOn, events, streams] = await Promise.all([
    count(db, 'SELECT count(*) AS n FROM accounts'),
    count(db, 'SELECT count(*) AS n FROM accounts WHERE admin = 1'),
    count(db, 'SELECT count(*) AS n FROM sign_ins WHERE expires_at > ?1', now),
    count(db, 'SELECT count(*) AS n FROM flags'),
    count(db, "SELECT count(*) AS n FROM flags WHERE enabled = 1 OR coalesce(allowlist, '') <> '' OR percent > 0"),
    count(db, 'SELECT count(*) AS n FROM stream_events'),
    count(db, 'SELECT count(DISTINCT stream) AS n FROM stream_events'),
  ]);
  return c.json({ accounts, admins, signIns, flags, flagsOn, events, streams });
});

admin.get('/accounts', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT a.account_id, a.email, a.name, a.admin, a.opened_at,
            (SELECT count(*) FROM sign_ins s WHERE s.account_id = a.account_id AND s.expires_at > ?1) AS live
     FROM accounts a ORDER BY a.opened_at, a.account_id`).bind(new Date().toISOString())
    .all<{ account_id: string; email: string; name: string; admin: number; opened_at: string; live: number }>();
  return c.json({ accounts: results.map((r) => ({ accountId: r.account_id, email: r.email, name: r.name, admin: r.admin === 1, openedAt: r.opened_at, liveSignIns: r.live })) });
});

// An admin opens an account for someone: recorded as AccountOpened by the engine, exactly like `just user-add`.
// The password is a starting one the admin passes on; it is hashed here and never stored or returned.
const NewAccount = Schema.Struct({
  email: Schema.String.check(Schema.isMinLength(3), Schema.isMaxLength(254), Schema.isPattern(/^[^@\s]+@[^@\s]+$/)),
  name: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(80)),
  password: Schema.String.check(Schema.isMinLength(12), Schema.isMaxLength(200)),
  admin: Schema.Boolean,
});
admin.post('/accounts', async (c) => {
  const decoded = Schema.decodeUnknownOption(NewAccount)(await c.req.json().catch(() => null));
  if (decoded._tag === 'None') return c.json({ rejected: 'an email, a name, a password of at least 12 characters, and a role' }, 400);
  const outcome = await run(c.env, Accounts.use((a) => a.open(decoded.value)).pipe(
    Effect.map((account) => ({ ok: true as const, account })),
    Effect.catchTag('SignUpRefused', (e) => Effect.succeed({ ok: false as const, message: e.message })),
  ));
  return outcome.ok ? c.json({ account: outcome.account }, 201) : c.json({ rejected: outcome.message }, 409);
});

// The newest events first, optionally one stream. Data is shown as recorded, with secrets masked.
admin.get('/events', async (c) => {
  const stream = c.req.query('stream')?.trim();
  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 50) || 50, 1), 200);
  const q = stream
    ? c.env.DB.prepare('SELECT stream, version, type, data, issued_by, recorded_at FROM stream_events WHERE stream = ?1 ORDER BY version DESC LIMIT ?2').bind(stream, limit)
    : c.env.DB.prepare('SELECT stream, version, type, data, issued_by, recorded_at FROM stream_events ORDER BY recorded_at DESC, stream, version DESC LIMIT ?1').bind(limit);
  const { results } = await q.all<{ stream: string; version: number; type: string; data: string; issued_by: string; recorded_at: string }>();
  return c.json({ events: results.map((r) => ({ stream: r.stream, version: r.version, type: r.type, by: r.issued_by, at: r.recorded_at, data: mask(JSON.parse(r.data)) })) });
});
