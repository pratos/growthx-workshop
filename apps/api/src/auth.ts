import { Hono, type MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { Context, Effect, Layer, Schema } from 'effect';
import { DECOY, hashPassword, newToken, tokenHash, verifyPassword } from './password';
import type { Env } from './services';

// Accounts: email and password in, a session token out. The project's own sign-in, in the spirit of Rails 8's
// authentication generator: two tables, one hash function, no auth library. Same shape as the other services:
// a Context.Service with a D1 layer and an in-memory test layer, Schema at the boundary, typed errors.

export const Role = Schema.Literals(['admin', 'member']);
export const User = Schema.Struct({ id: Schema.String, email: Schema.String, name: Schema.String, role: Role });
export type User = typeof User['Type'];

const SignIn = Schema.Struct({
  email: Schema.String.check(Schema.isMinLength(3), Schema.isMaxLength(254)),
  password: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(200)),
});
const decodeSignIn = Schema.decodeUnknownEffect(SignIn);

// One message for an unknown email and a wrong password, so the form does not reveal who has an account.
export class SignInFailed extends Schema.TaggedError<SignInFailed>()('SignInFailed', { message: Schema.String }) {}

const SESSION_DAYS = 30;
export const COOKIE = 'gh_session';

type Row = User & { password_hash: string };

export class Accounts extends Context.Service<Accounts, {
  signIn(body: unknown): Effect.Effect<{ token: string; user: User }, SignInFailed>;
  userFor(token: string): Effect.Effect<User | undefined>;
  signOut(token: string): Effect.Effect<void>;
}>()('greenhouse/api/Accounts') {
  static readonly layer = (db: D1Database) => Layer.sync(Accounts, () => {
    const signIn = Effect.fn('Accounts.signIn')(function* (body: unknown) {
      const failed = new SignInFailed({ message: 'wrong email or password' });
      const { email, password } = yield* decodeSignIn(body).pipe(Effect.mapError(() => failed));
      const row = yield* Effect.promise(() => db.prepare('SELECT id, email, name, role, password_hash FROM users WHERE email = ?1').bind(email.trim().toLowerCase()).first<Row>());
      const ok = yield* Effect.promise(() => verifyPassword(password, row?.password_hash ?? DECOY));
      if (!row || !ok) return yield* failed;
      const token = newToken();
      const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
      yield* Effect.promise(async () => db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?1, ?2, ?3)').bind(await tokenHash(token), row.id, expires).run());
      return { token, user: { id: row.id, email: row.email, name: row.name, role: row.role } };
    });
    const userFor = Effect.fn('Accounts.userFor')(function* (token: string) {
      const hash = yield* Effect.promise(() => tokenHash(token));
      const row = yield* Effect.promise(() =>
        db.prepare("SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?1 AND s.expires_at > ?2")
          .bind(hash, new Date().toISOString()).first<User>());
      return row ?? undefined;
    });
    const signOut = Effect.fn('Accounts.signOut')(function* (token: string) {
      const hash = yield* Effect.promise(() => tokenHash(token));
      yield* Effect.promise(() => db.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(hash).run());
    });
    return Accounts.of({ signIn, userFor, signOut });
  });

  // Tests: the same decode, hash check and failure over Maps, no D1.
  static readonly layerTest = (users: ReadonlyArray<User & { password: string }>) => Layer.effect(Accounts, Effect.promise(async () => {
    const byEmail = new Map<string, Row>();
    for (const u of users) byEmail.set(u.email, { id: u.id, email: u.email, name: u.name, role: u.role, password_hash: await hashPassword(u.password) });
    const sessions = new Map<string, User>();
    const signIn = Effect.fn('Accounts.signIn')(function* (body: unknown) {
      const failed = new SignInFailed({ message: 'wrong email or password' });
      const { email, password } = yield* decodeSignIn(body).pipe(Effect.mapError(() => failed));
      const row = byEmail.get(email.trim().toLowerCase());
      const ok = yield* Effect.promise(() => verifyPassword(password, row?.password_hash ?? DECOY));
      if (!row || !ok) return yield* failed;
      const token = newToken();
      const user: User = { id: row.id, email: row.email, name: row.name, role: row.role };
      sessions.set(token, user);
      return { token, user };
    });
    return Accounts.of({
      signIn,
      userFor: (token) => Effect.sync(() => sessions.get(token)),
      signOut: (token) => Effect.sync(() => void sessions.delete(token)),
    });
  }));
}

// The token comes from `Authorization: Bearer …` (curl, the web Worker over the binding, an agent) or the session cookie (a browser on the api).
export const tokenOf = (header: string | undefined, cookie: string | undefined) =>
  header?.startsWith('Bearer ') ? header.slice(7).trim() : cookie;

const run = <A, E>(env: Env, program: Effect.Effect<A, E, Accounts>) => Effect.runPromise(program.pipe(Effect.provide(Accounts.layer(env.DB))));

export async function currentUser(env: Env, header: string | undefined, cookie: string | undefined): Promise<User | undefined> {
  const token = tokenOf(header, cookie);
  return token ? run(env, Accounts.use((a) => a.userFor(token))) : undefined;
}

// Admin routes: 401 without a session, 403 for a member. Every admin action is an API first, so this is the one gate.
export const requireAdmin: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const user = await currentUser(c.env, c.req.header('authorization'), getCookie(c, COOKIE));
  if (!user) return c.json({ rejected: 'sign in first' }, 401);
  if (user.role !== 'admin') return c.json({ rejected: `admins only; ${user.id} is a ${user.role}` }, 403);
  return next();
};

// ---- The edge: POST /auth/sign-in (JSON or a form), POST /auth/sign-out, GET /auth/me.

export const auth = new Hono<{ Bindings: Env }>();

auth.post('/sign-in', async (c) => {
  const type = c.req.header('content-type') ?? '';
  const body = type.includes('form') ? Object.fromEntries(await c.req.formData()) : await c.req.json().catch(() => null);
  const outcome = await run(c.env, Accounts.use((a) => a.signIn(body)).pipe(
    Effect.map((s) => ({ ok: true as const, ...s })),
    Effect.catchTag('SignInFailed', (e) => Effect.succeed({ ok: false as const, message: e.message })),
  ));
  if (!outcome.ok) return c.json({ rejected: outcome.message }, 401);
  setCookie(c, COOKIE, outcome.token, { httpOnly: true, sameSite: 'Lax', secure: new URL(c.req.url).protocol === 'https:', path: '/', maxAge: SESSION_DAYS * 86_400 });
  return c.json({ user: outcome.user, token: outcome.token });
});

auth.post('/sign-out', async (c) => {
  const token = tokenOf(c.req.header('authorization'), getCookie(c, COOKIE));
  if (token) await run(c.env, Accounts.use((a) => a.signOut(token)));
  deleteCookie(c, COOKIE, { path: '/' });
  return c.json({ ok: true });
});

auth.get('/me', async (c) => {
  const user = await currentUser(c.env, c.req.header('authorization'), getCookie(c, COOKIE));
  return user ? c.json({ user }) : c.json({ rejected: 'not signed in' }, 401);
});
