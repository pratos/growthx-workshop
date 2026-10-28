import { Hono, type MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { Effect, Layer } from 'effect';
import { EventStore } from '@greenhouse/engine';
import { d1 } from '@greenhouse/engine/adapters/d1';
import { Accounts, accountsView } from '@greenhouse/domain';
import type { Account } from '@greenhouse/schema';
import type { Env } from './services';

// The edge for Identity. Accounts is event-sourced on the engine: D1 holds the log and the accounts projection,
// written in one batch. This file only maps HTTP to the Accounts service and back.

export const COOKIE = 'gh_session';
const DAYS = 30;

const accountsLayer = (env: Env) => Accounts.layer().pipe(Layer.provideMerge(EventStore.layer([accountsView]).pipe(Layer.provideMerge(d1(env.DB)))));
const run = <A, E>(env: Env, program: Effect.Effect<A, E, Accounts>) => Effect.runPromise(program.pipe(Effect.provide(accountsLayer(env))));

// The token comes from `Authorization: Bearer …` (curl, the web Worker over the binding, the agent) or the cookie (a browser on the api).
export const tokenOf = (header: string | undefined, cookie: string | undefined) => (header?.startsWith('Bearer ') ? header.slice(7).trim() : cookie);

export async function currentAccount(env: Env, header: string | undefined, cookie: string | undefined): Promise<Account | undefined> {
  const token = tokenOf(header, cookie);
  return token ? run(env, Accounts.use((a) => a.accountFor(token))) : undefined;
}

type Vars = { Bindings: Env; Variables: { account: Account } };

// Signed-in routes: 401 without a live sign-in. The account is on the context for the handler.
export const requireSignIn: MiddlewareHandler<Vars> = async (c, next) => {
  const account = await currentAccount(c.env, c.req.header('authorization'), getCookie(c, COOKIE));
  if (!account) return c.json({ rejected: 'sign in first' }, 401);
  c.set('account', account);
  return next();
};

// Admin routes: 401 without a sign-in, 403 for everyone but admins. Every admin action is an API first, so this is the one gate.
export const requireAdmin: MiddlewareHandler<Vars> = async (c, next) => {
  const account = await currentAccount(c.env, c.req.header('authorization'), getCookie(c, COOKIE));
  if (!account) return c.json({ rejected: 'sign in first' }, 401);
  if (!account.admin) return c.json({ rejected: `admins only; ${account.accountId} is not an admin` }, 403);
  c.set('account', account);
  return next();
};

const bodyOf = async (c: { req: { header(n: string): string | undefined; formData(): Promise<FormData>; json(): Promise<unknown> } }) =>
  (c.req.header('content-type') ?? '').includes('form') ? Object.fromEntries(await c.req.formData()) : await c.req.json().catch(() => null);

// Abuse costs money on Workers: every request, D1 row and Durable Object wake is billed. A rate-limit binding caps them
// per key (an IP for sign-in, an account for writes); with no binding (tests, bare dev) it lets everything through.
export const rateLimit = (binding: 'AUTH_LIMIT' | 'WRITE_LIMIT', keyOf: (c: { req: { header(n: string): string | undefined }; get(k: 'account'): Account | undefined }) => string): MiddlewareHandler<Vars> =>
  async (c, next) => {
    const limiter = c.env[binding];
    if (limiter && !(await limiter.limit({ key: keyOf(c as never) })).success) return c.json({ rejected: 'too many requests; try again in a minute' }, 429);
    return next();
  };
const byIp = rateLimit('AUTH_LIMIT', (c) => `ip:${c.req.header('cf-connecting-ip') ?? 'local'}`);

// ---- POST /auth/sign-up, POST /auth/sign-in (JSON or a form), POST /auth/sign-out, GET /auth/me.

export const auth = new Hono<Vars>();

auth.post('/sign-up', byIp, async (c) => {
  const body = await bodyOf(c);
  const outcome = await run(c.env, Accounts.use((a) => a.signUp(body)).pipe(
    Effect.map((account) => ({ ok: true as const, account })),
    Effect.catchTag('SignUpRefused', (e) => Effect.succeed({ ok: false as const, message: e.message })),
  ));
  return outcome.ok ? c.json({ account: outcome.account }, 201) : c.json({ rejected: outcome.message }, 409);
});

auth.post('/sign-in', byIp, async (c) => {
  const body = await bodyOf(c);
  const outcome = await run(c.env, Accounts.use((a) => a.signIn(body)).pipe(
    Effect.map((s) => ({ ok: true as const, ...s })),
    Effect.catchTag('SignInFailed', (e) => Effect.succeed({ ok: false as const, message: e.message })),
  ));
  if (!outcome.ok) return c.json({ rejected: outcome.message }, 401);
  setCookie(c, COOKIE, outcome.token, { httpOnly: true, sameSite: 'Lax', secure: new URL(c.req.url).protocol === 'https:', path: '/', maxAge: DAYS * 86_400 });
  return c.json({ account: outcome.account, token: outcome.token });
});

auth.post('/sign-out', async (c) => {
  const token = tokenOf(c.req.header('authorization'), getCookie(c, COOKIE));
  if (token) await run(c.env, Accounts.use((a) => a.signOut(token)));
  deleteCookie(c, COOKIE, { path: '/' });
  return c.json({ ok: true });
});

auth.get('/me', async (c) => {
  const account = await currentAccount(c.env, c.req.header('authorization'), getCookie(c, COOKIE));
  return account ? c.json({ account }) : c.json({ rejected: 'not signed in' }, 401);
});
