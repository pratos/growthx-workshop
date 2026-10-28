import { test, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openBrain } from '../src/brain.ts';
import { fauxCallCount } from '../src/model.ts';

// The durable part, on a real pi-durable store with the faux model: a run asked again after a restart is answered from
// the store, with no second model call. This is what makes `kill -9` then "run it again" safe.
test('the same run after a restart is answered once, from the store', async () => {
  process.env.AGENT_MODEL = 'faux';
  const db = join(mkdtempSync(join(tmpdir(), 'gh-brain-')), 'agent.sqlite');

  const first = await openBrain(db);
  const before = fauxCallCount();
  const answer = await first.answer('s1', 'r1', 'client or wrapper?');
  await first.close();
  expect(fauxCallCount() - before).toBe(1);

  const again = await openBrain(db);
  const repeat = await again.answer('s1', 'r1', 'client or wrapper?');
  await again.close();
  expect(repeat).toBe(answer);
  expect(fauxCallCount() - before).toBe(1);
}, 30_000);
