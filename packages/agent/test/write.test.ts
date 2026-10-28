import { expect, test } from 'bun:test';
import { askedLine, intoPlan, tick, WRITE_PREFIX, type SessionsApi } from '../src/loop.ts';

// "/ask" in the editor: the agent's answer replaces the line the editor left, credited, as the editor's blocks.
const doc = (...content: unknown[]) => JSON.stringify({ type: 'doc', content });
const p = (t: string) => ({ type: 'paragraph', content: [{ type: 'text', text: t }] });

test('the answer replaces the /ask line, credited, with headings, lists and paragraphs', () => {
  const before = doc(p('Context.'), p(askedLine('a rollout plan')), p('Open questions.'));
  const after = JSON.parse(intoPlan(before, 'a rollout plan', '## Rollout\n\n- flag on for pratos\n- then everyone\n\nRoll back with the flag.')) as { content: { type: string; content?: { text?: string }[] }[] };
  expect(after.content.map((n) => n.type)).toEqual(['paragraph', 'paragraph', 'heading', 'bulletList', 'paragraph', 'paragraph']);
  expect(after.content[1]?.content?.[0]?.text).toBe('Written by the agent: a rollout plan');
  expect(after.content.at(-1)?.content?.[0]?.text).toBe('Open questions.');
});

test('an /ask line inside a list comes out of the list, and the answer follows the list', () => {
  const list = { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [p('Pick the budget')] }, { type: 'taskItem', attrs: { checked: false }, content: [p(askedLine('risks'))] }] };
  const after = JSON.parse(intoPlan(doc(list), 'risks', 'Duplicates.')) as { content: { type: string; content?: { content?: unknown[] }[] }[] };
  expect(after.content.map((n) => n.type)).toEqual(['taskList', 'paragraph', 'paragraph']);
  expect(JSON.stringify(after.content[0])).not.toContain('Asked the agent');
});

test('with the /ask line gone, the answer goes at the end; an empty plan starts one', () => {
  expect((JSON.parse(intoPlan(doc(p('Context.')), 'x', 'Done.')) as { content: unknown[] }).content).toHaveLength(3);
  expect((JSON.parse(intoPlan('', 'x', 'Done.')) as { content: unknown[] }).content).toHaveLength(2);
});

test('a finished "/ask" run is written into the plan; any other run is not', async () => {
  const wrote: string[][] = [];
  const runs = [
    { runId: 'r1', status: 'queued' as const, askedBy: 'pratos', asked: `${WRITE_PREFIX}a rollout plan` },
    { runId: 'r2', status: 'queued' as const, askedBy: 'pratos', asked: 'what is a retry budget?' },
  ];
  const api: SessionsApi = {
    list: async () => [{ sessionId: 's1', status: 'open', participants: ['agent', 'pratos'], runs: runs.filter((r) => r.status === 'queued').slice(0, 1) }],
    command: async (_plan, type, data) => { if (type === 'FinishRun') { const r = runs.find((x) => x.runId === data.runId); if (r) (r as { status: string }).status = 'finished'; } return { ok: true }; },
    writeIntoPlan: async (_plan, prompt, answer) => { wrote.push([prompt, answer]); return { ok: true }; },
  };
  const brain = { answer: async (_s: string, _r: string, asked: string) => `answer to ${asked}` };
  await tick('gh-12', 'agent', api, brain);
  await tick('gh-12', 'agent', api, brain);
  expect(wrote).toEqual([['a rollout plan', `answer to ${WRITE_PREFIX}a rollout plan`]]);
});
