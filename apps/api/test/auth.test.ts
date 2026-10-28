import { test, expect } from 'bun:test';
import { Effect } from 'effect';
import { Accounts } from '../src/auth';
import { hashPassword, verifyPassword } from '../src/password';

// Sign-in over Maps: the same decode, hash check and single failure message the D1 layer uses.
const users = [
  { id: 'admin', email: 'admin@greenhouse.test', name: 'Admin', role: 'admin' as const, password: 'greenhouse-admin-local' },
  { id: 'sam', email: 'sam@greenhouse.test', name: 'Sam', role: 'member' as const, password: 'greenhouse-sam-local' },
];
const run = <A, E>(program: Effect.Effect<A, E, Accounts>) => Effect.runPromise(program.pipe(Effect.provide(Accounts.layerTest(users))));
const outcome = <A>(p: Effect.Effect<A, { _tag: string; message: string }>) => p.pipe(Effect.map(() => 'signed in'), Effect.catch((e) => Effect.succeed(`${e._tag}: ${e.message}`)));

test('the right password signs in, and the token finds the user until sign-out', async () => {
  const seen = await run(Effect.gen(function* () {
    const a = yield* Accounts;
    const { token, user } = yield* a.signIn({ email: 'Admin@Greenhouse.test ', password: 'greenhouse-admin-local' });
    const before = yield* a.userFor(token);
    yield* a.signOut(token);
    return { user, before: before?.id, after: (yield* a.userFor(token))?.id };
  }));
  expect(seen).toEqual({ user: { id: 'admin', email: 'admin@greenhouse.test', name: 'Admin', role: 'admin' }, before: 'admin', after: undefined });
});

test('a wrong password, an unknown email and a junk body all fail with the same message', async () => {
  const results = await run(Effect.gen(function* () {
    const a = yield* Accounts;
    return [
      yield* outcome(a.signIn({ email: 'sam@greenhouse.test', password: 'wrong' })),
      yield* outcome(a.signIn({ email: 'nobody@greenhouse.test', password: 'greenhouse-sam-local' })),
      yield* outcome(a.signIn(null)),
    ];
  }));
  expect(results).toEqual(Array(3).fill('SignInFailed: wrong email or password'));
});

test('a hash verifies its own password only, and two hashes of one password differ', async () => {
  const [h1, h2] = [await hashPassword('correct horse'), await hashPassword('correct horse')];
  expect([await verifyPassword('correct horse', h1), await verifyPassword('correct hors', h1), h1 === h2]).toEqual([true, false, false]);
});
