import { test, expect } from 'bun:test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { upcast } from './index';
import { describeMessage } from '../kernel';
import type { StoredEvent } from '../index';

// The input is a verbatim v1 stream as prod recorded it. The snapshot shows what the domain reads.
const v1: StoredEvent[] = [
  { version: 1, type: 'ThreadOpened', at: '2026-10-20T10:00:00Z', by: 'pratos', data: { threadId: 't7', blockId: 'b3', by: 'pratos', body: 'retries in the client or the wrapper?' } },
  { version: 2, type: 'ReplyPosted', at: '2026-10-20T10:05:00Z', by: 'agent', data: { threadId: 't7', by: 'agent', body: 'wrapper: one place to change' } },
  { version: 3, type: 'ThreadResolved', at: '2026-10-20T10:09:00Z', by: 'pratos', data: { threadId: 't7', by: 'pratos' } },
  { version: 4, type: 'DecisionRecorded', at: '2026-10-20T10:09:00Z', by: 'pratos', data: { threadId: 't7', blockId: 'b3', by: 'pratos', decision: 'wrapper' } },
] as StoredEvent[];

test('v1 DecisionRecorded reads as v2 with the rationale defaulted from the last reply', () => {
  const text = ['v1 stream as recorded', ...v1.map((e) => '  ' + describeMessage(e)), 'read through upcast', ...upcast(v1).map((e) => '  ' + describeMessage(e))].join('\n') + '\n';
  const file = join(import.meta.dir, '__expect__', 'decision-recorded-v1-to-v2.snap.txt');
  if (!existsSync(file) || process.env.UPDATE_SNAPSHOTS) writeFileSync(file, text);
  expect(text).toBe(readFileSync(file, 'utf8'));
});
