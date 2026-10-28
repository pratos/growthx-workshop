import { test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { Effect, Layer } from 'effect';
import { EventStore, testCtx } from '@greenhouse/engine';
import { bunSqlite } from '@greenhouse/engine/adapters/bun-sqlite';
import { story } from '@greenhouse/engine/story';
import { session, sessionStream, sessionsView, listSessions, StartSession, JoinSession, Ask, StartRun, FinishRun, FailRun, Steer, EndSession, AGENT } from '@greenhouse/domain';
import { tick, type SessionsApi, type Answerer } from '../src/loop.ts';

// The agent loop as stories: it runs against the real session model and engine (in-memory SQLite) instead of HTTP, so
// each step shows exactly which events the agent recorded. The brain is a stand-in that answers, or fails, on cue.
const commands = { StartSession, JoinSession, Ask, StartRun, Steer, FinishRun, FailRun, EndSession } as const;

function world() {
  let n = 0;
  const ctx = testCtx({ newId: () => `r${++n}` });
  const layer = EventStore.layer([sessionsView]).pipe(Layer.provideMerge(bunSqlite(new Database(':memory:'))));
  const s = story(layer, import.meta.dir);
  const exec = (type: keyof typeof commands, data: Record<string, unknown>) =>
    EventStore.use((st) => st.execute(session, sessionStream(String(data.sessionId)), commands[type](data as never) as never, ctx, String(data.by)));
  // The same contract the HTTP API gives the agent: list a plan's sessions, send a command as the signed-in participant.
  const api: SessionsApi = {
    list: () => s.run(listSessions()) as never,
    command: async (_plan, type, data) => {
      const r = await s.run(exec(type as keyof typeof commands, { ...data, by: AGENT }));
      return 'rejected' in r ? { ok: false, rejected: r.rejected } : { ok: true };
    },
  };
  return { s, exec, api, setup: () => s.run(EventStore.use((st) => st.setup())) };
}
const brain = (script: Array<string | Error>): Answerer => ({
  answer: async () => { const next = script.shift() ?? new Error('no answer scripted'); if (next instanceof Error) throw next; return next; },
});
const agentTick = (api: SessionsApi, b: Answerer) => Effect.promise(() => tick('gh-12', AGENT, api, b));
const runs = "SELECT run_id, asked_by, status, coalesce(run_by, '-'), coalesce(result, '-') FROM runs ORDER BY run_id";
const S = { sessionId: 's1' };

test('the agent answers in order, leaves a person’s run alone, and resumes its own', async () => {
  const { s, exec, api, setup } = world(); await setup();
  await s.step('Pratos starts a session and asks twice', Effect.gen(function* () {
    yield* exec('StartSession', { ...S, planId: 'gh-12', by: 'pratos', title: 'retry policy' });
    yield* exec('Ask', { ...S, by: 'pratos', asked: 'client or wrapper?' });
    return yield* exec('Ask', { ...S, by: 'pratos', asked: 'and the backoff?' });
  }));
  await s.step('one agent pass answers the first question only', agentTick(api, brain(['wrapper: one place to change'])));
  await s.step('Pratos takes the second question', exec('StartRun', { ...S, runId: 'r2', by: 'pratos' }));
  await s.step('an agent pass leaves Pratos’s run alone', agentTick(api, brain(['should not be used'])));
  await s.step('Pratos finishes it', exec('FinishRun', { ...S, runId: 'r2', by: 'pratos', result: 'exponential, capped at 30s' }));
  await s.step('Pratos asks a third question', exec('Ask', { ...S, by: 'pratos', asked: 'and idempotency?' }));
  await s.step('the agent starts it, then its process is killed before it answers', exec('StartRun', { ...S, runId: 'r3', by: AGENT }));
  await s.step('the restarted agent resumes its own running run and finishes it', agentTick(api, brain(['the request id is the key'])));
  await s.read('runs', runs);
  s.snapshot('answers-in-order');
});

test('a run the agent cannot answer is failed with the reason, after three tries', async () => {
  const { s, exec, api, setup } = world(); await setup();
  await s.step('Pratos starts a session and asks', Effect.gen(function* () {
    yield* exec('StartSession', { ...S, planId: 'gh-12', by: 'pratos', title: 'retry policy' });
    return yield* exec('Ask', { ...S, by: 'pratos', asked: 'client or wrapper?' });
  }));
  await s.step('the model fails three times in one pass', agentTick(api, brain([new Error('model unavailable'), new Error('model unavailable'), new Error('model unavailable')])));
  await s.step('Pratos asks again', exec('Ask', { ...S, by: 'pratos', asked: 'client or wrapper, again?' }));
  await s.step('the model recovers on the second try', agentTick(api, brain([new Error('timeout'), 'wrapper'])));
  await s.read('runs', runs);
  s.snapshot('fails-after-three');
});
