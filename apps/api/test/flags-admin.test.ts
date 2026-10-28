import { test, expect } from 'bun:test';
import { Effect } from 'effect';
import { FlagsAdmin, type FlagRow } from '../src/flags-admin';

// The admin service over a Map, with the same validation and merge the D1 layer uses. No D1, no HTTP.
const run = <A, E>(program: Effect.Effect<A, E, FlagsAdmin>, initial: ReadonlyArray<FlagRow> = []) =>
  Effect.runPromise(program.pipe(Effect.provide(FlagsAdmin.layerTest(initial))));

test('set then list: a new flag starts off, each PUT keeps what it does not mention', async () => {
  const flags = await run(Effect.gen(function* () {
    const admin = yield* FlagsAdmin;
    yield* admin.set('resolve-thread', { allowlist: ['admin', 'pratos'] });
    yield* admin.set('resolve-thread', { percent: 25 });
    yield* admin.set('agent-replies', { enabled: true });
    return yield* admin.list();
  }));
  expect(flags).toEqual([
    { name: 'agent-replies', enabled: true, allowlist: [], percent: 0 },
    { name: 'resolve-thread', enabled: false, allowlist: ['admin', 'pratos'], percent: 25 },
  ]);
});

test('an invalid percent is a typed error, and the flag is not written', async () => {
  const outcome = await run(Effect.gen(function* () {
    const admin = yield* FlagsAdmin;
    const error = yield* admin.set('resolve-thread', { percent: 250 }).pipe(Effect.map(() => 'accepted'), Effect.catchTag('FlagInvalid', (e) => Effect.succeed(`${e._tag}:${e.name}`)));
    return { error, flags: yield* admin.list() };
  }));
  expect(outcome.error).toBe('FlagInvalid:resolve-thread');
  expect(outcome.flags).toEqual([]);
});

// Collapse an outcome to a label: what the set accepted, or the tag of the error it raised.
const tag = (p: Effect.Effect<FlagRow, { _tag: string }>) => p.pipe(Effect.map(() => 'accepted'), Effect.catch((e) => Effect.succeed(e._tag)));

test('a non-object body and an empty name are the same typed error', async () => {
  const tags = await run(Effect.gen(function* () {
    const admin = yield* FlagsAdmin;
    return [yield* tag(admin.set('x', null)), yield* tag(admin.set('', { enabled: true })), yield* tag(admin.set('x', { enabled: 'yes' }))];
  }));
  expect(tags).toEqual(['FlagInvalid', 'FlagInvalid', 'FlagInvalid']);
});
