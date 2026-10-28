import { test, expect } from 'bun:test';
import { Effect } from 'effect';
import { Commands } from '../src/services';

// The use case, tested with the same decider over an in-memory log and a fixed flag set. No Durable Object, no D1, no HTTP.
const run = <A, E>(flags: string[] | ((p: string) => string[]), program: Effect.Effect<A, E, Commands>) =>
  Effect.runPromise(program.pipe(Effect.provide(Commands.layerTest(flags))));

test('a guest cannot resolve a thread while the flag is off for them', async () => {
  const outcome = await run((p) => (p === 'pratos' ? ['resolve-thread'] : []), Effect.gen(function* () {
    const cmds = yield* Commands;
    const [opened] = yield* cmds.dispatch('p1', { type: 'OpenThread', by: 'pratos', data: { blockId: 'b3', body: 'client or wrapper?' } });
    const threadId = (opened!.data as { threadId: string }).threadId;
    const guest = yield* cmds.dispatch('p1', { type: 'ResolveThread', by: 'guest', data: { threadId, decision: 'wrapper' } }).pipe(Effect.catchTag('CommandRejected', (e) => Effect.succeed(e.reason)));
    const owner = yield* cmds.dispatch('p1', { type: 'ResolveThread', by: 'pratos', data: { threadId, decision: 'wrapper' } });
    return { guest, owner: owner.map((e) => e.type) };
  }));
  expect(outcome.guest).toBe('resolve-thread is not enabled for this participant');
  expect(outcome.owner).toEqual(['ThreadResolved', 'DecisionRecorded']);
});

test('an invalid envelope is a typed error, not a crash', async () => {
  const message = await run([], Commands.use((c) => c.dispatch('p1', { type: 'Nope', by: '', data: {} })).pipe(Effect.catchTag('InvalidCommand', (e) => Effect.succeed(`invalid ${e.type}`))));
  expect(message).toBe('invalid Nope');
});
