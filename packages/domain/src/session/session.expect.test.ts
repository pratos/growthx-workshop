import { test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { Layer } from 'effect';
import { EventStore, testCtx } from '@greenhouse/engine';
import { bunSqlite } from '@greenhouse/engine/adapters/bun-sqlite';
import { story } from '@greenhouse/engine/story';
import { session, sessionStream, StartSession, JoinSession, Ask, StartRun, Steer, FinishRun, EndSession, AGENT, type SessionCommand } from './decider';
// <cp-08>
import { FailRun } from './decider';
// </cp-08>
import { sessionsView } from './view';

// Agent work as stories through the real engine: one person with the agent, then three people with the agent.
const world = () => {
  let n = 0;
  const ctx = testCtx({ newId: () => `r${++n}` });
  const s = story(EventStore.layer([sessionsView]).pipe(Layer.provideMerge(bunSqlite(new Database(':memory:')))), import.meta.dir);
  const exec = (cmd: SessionCommand) => EventStore.use((st) => st.execute(session, sessionStream('s1'), cmd, ctx, (cmd.data as { by: string }).by));
  return { s, exec, setup: () => s.run(EventStore.use((st) => st.setup())) };
};
const runs = "SELECT run_id, asked_by, status, coalesce(run_by, '-'), steers, coalesce(result, '-') FROM runs ORDER BY run_id";
const people = 'SELECT participant FROM session_participants ORDER BY joined_at, participant';
const sessions = 'SELECT session_id, plan_id, started_by, status FROM sessions';
const S = { sessionId: 's1' };

test('one person and the agent', async () => {
  const { s, exec, setup } = world(); await setup();
  await s.step('Pratos starts a session on plan gh-12', exec(StartSession({ ...S, planId: 'gh-12', by: 'pratos', title: 'retry policy' })));
  await s.step('Pratos asks where retries should live', exec(Ask({ ...S, by: 'pratos', asked: 'client or wrapper for retries?' })));
  await s.step('the agent starts the run', exec(StartRun({ ...S, runId: 'r1', by: AGENT })));
  await s.step('Pratos ends the session mid-run', exec(EndSession({ ...S, by: 'pratos' })));
  await s.step('the agent finishes the run', exec(FinishRun({ ...S, runId: 'r1', by: AGENT, result: 'wrapper: one place to change' })));
  await s.step('Pratos asks a follow-up', exec(Ask({ ...S, by: 'pratos', asked: 'and the backoff?' })));
  await s.step('the agent starts it', exec(StartRun({ ...S, runId: 'r2', by: AGENT })));
  await s.step('the agent finishes it', exec(FinishRun({ ...S, runId: 'r2', by: AGENT, result: 'exponential, capped at 30s' })));
  await s.step('Pratos ends the session', exec(EndSession({ ...S, by: 'pratos' })));
  await s.step('Pratos asks after the end', exec(Ask({ ...S, by: 'pratos', asked: 'one more thing' })));
  await s.read('sessions', sessions);
  await s.read('runs', runs);
  s.snapshot('one-person');
});

test('three people and the agent', async () => {
  const { s, exec, setup } = world(); await setup();
  await s.step('Pratos starts a session on plan gh-12', exec(StartSession({ ...S, planId: 'gh-12', by: 'pratos', title: 'retry policy' })));
  await s.step('Sam asks before joining', exec(Ask({ ...S, by: 'sam', asked: 'what about idempotency?' })));
  await s.step('Sam joins', exec(JoinSession({ ...S, by: 'sam' })));
  await s.step('Ana joins', exec(JoinSession({ ...S, by: 'ana' })));
  await s.step('Sam joins again', exec(JoinSession({ ...S, by: 'sam' })));
  await s.step('Pratos asks', exec(Ask({ ...S, by: 'pratos', asked: 'client or wrapper for retries?' })));
  await s.step('Sam asks while that is queued', exec(Ask({ ...S, by: 'sam', asked: 'what about idempotency?' })));
  await s.step("the agent tries Sam's run first", exec(StartRun({ ...S, runId: 'r2', by: AGENT })));
  await s.step('the agent starts the first run', exec(StartRun({ ...S, runId: 'r1', by: AGENT })));
  await s.step('the agent starts the second as well', exec(StartRun({ ...S, runId: 'r2', by: AGENT })));
  await s.step('Ana steers the running run', exec(Steer({ ...S, runId: 'r1', by: 'ana', steer: 'keep the wrapper sync' })));
  await s.step('Sam tries to finish the agent’s run', exec(FinishRun({ ...S, runId: 'r1', by: 'sam', result: 'client' })));
  await s.step('the agent finishes the first run', exec(FinishRun({ ...S, runId: 'r1', by: AGENT, result: 'wrapper, kept sync' })));
  await s.step('Sam starts their own question', exec(StartRun({ ...S, runId: 'r2', by: 'sam' })));
  await s.step('Pratos steers it', exec(Steer({ ...S, runId: 'r2', by: 'pratos', steer: 'use the request id' })));
  await s.step('Sam finishes it', exec(FinishRun({ ...S, runId: 'r2', by: 'sam', result: 'idempotency key = request id' })));
  await s.step('Ana ends the session', exec(EndSession({ ...S, by: 'ana' })));
  await s.step('Pratos ends the session', exec(EndSession({ ...S, by: 'pratos' })));
  await s.read('sessions', sessions);
  await s.read('participants', people);
  await s.read('runs', runs);
  s.snapshot('three-people');
});

// <cp-08>
test('the agent cannot finish, and says why', async () => {
  const { s, exec, setup } = world(); await setup();
  await s.step('Pratos starts a session on plan gh-12', exec(StartSession({ ...S, planId: 'gh-12', by: 'pratos', title: 'retry policy' })));
  await s.step('Pratos asks', exec(Ask({ ...S, by: 'pratos', asked: 'client or wrapper for retries?' })));
  await s.step('the agent starts the run', exec(StartRun({ ...S, runId: 'r1', by: AGENT })));
  await s.step('Pratos tries to fail the agent’s run', exec(FailRun({ ...S, runId: 'r1', by: 'pratos', reason: 'too slow' })));
  await s.step('the model errors three times; the agent fails the run', exec(FailRun({ ...S, runId: 'r1', by: AGENT, reason: 'model unavailable after 3 tries' })));
  await s.step('the agent tries to finish it anyway', exec(FinishRun({ ...S, runId: 'r1', by: AGENT, result: 'late answer' })));
  await s.step('Pratos asks again', exec(Ask({ ...S, by: 'pratos', asked: 'client or wrapper, second try?' })));
  await s.step('the agent starts the new run', exec(StartRun({ ...S, runId: 'r2', by: AGENT })));
  await s.read('runs', runs);
  s.snapshot('agent-fails');
});
// </cp-08>
