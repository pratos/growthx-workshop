import { test } from 'bun:test';
import { expectDecider, testCtx } from '../kernel';
import { thread, OpenThread, Reply, ResolveThread, ThreadOpened, ReplyPosted, ThreadResolved } from './decider';

const expect = expectDecider(thread, import.meta.dir);
const opened = ThreadOpened({ threadId: 't7', blockId: 'b3', by: 'pratos', body: 'retries in the client or the wrapper?' });
const replied = ReplyPosted({ threadId: 't7', by: 'agent', body: 'wrapper: one place to change' });

test('open a thread on a block', () => {
  expect.given().when(OpenThread({ blockId: 'b3', by: 'pratos', body: 'retries in the client or the wrapper?' })).snapshot('open');
});
test('reply appends and keeps the thread open', () => {
  expect.given(opened).when(Reply({ threadId: 't7', by: 'agent', body: 'wrapper: one place to change' })).snapshot('reply');
});
test('resolve records two facts', () => {
  expect.given(opened, replied).when(ResolveThread({ threadId: 't7', by: 'pratos', decision: 'wrapper' })).snapshot('resolve');
});
test('resolve twice is rejected', () => {
  expect.given(opened, ThreadResolved({ threadId: 't7', by: 'pratos' })).when(ResolveThread({ threadId: 't7', by: 'agent', decision: 'client' })).snapshot('resolve-twice');
});
test('resolve behind a flag that is off', () => {
  expect.given(opened).when(ResolveThread({ threadId: 't7', by: 'guest', decision: 'wrapper' }), testCtx({ flag: () => false })).snapshot('resolve-flag-off');
});
