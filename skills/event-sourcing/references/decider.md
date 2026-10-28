# The decider shape

Small on purpose. Three pure functions per aggregate, one append path, one test format. TypeScript, any schema library that gives you a runtime type (the Greenhouse scaffold uses the shared `packages/schema`).

```ts
// packages/domain/thread/decider.ts
import { defineCommand, defineEvent, type Decider } from '../kernel';

export const OpenThread    = defineCommand('OpenThread',    { blockId: Id, by: ParticipantId, body: Text });
export const Reply         = defineCommand('Reply',         { threadId: Id, by: ParticipantId, body: Text });
export const ResolveThread = defineCommand('ResolveThread', { threadId: Id, by: ParticipantId, decision: Text });

export const ThreadOpened     = defineEvent('ThreadOpened',     { threadId: Id, blockId: Id, by: ParticipantId, body: Text });
export const ReplyPosted      = defineEvent('ReplyPosted',      { threadId: Id, by: ParticipantId, body: Text });
export const ThreadResolved   = defineEvent('ThreadResolved',   { threadId: Id, by: ParticipantId });
export const DecisionRecorded = defineEvent('DecisionRecorded', { threadId: Id, blockId: Id, by: ParticipantId, decision: Text });

type State = { kind: 'none' } | { kind: 'open'; blockId: Id } | { kind: 'resolved' };

export const thread: Decider<State> = {
  initial: { kind: 'none' },
  evolve(state, event) {
    switch (event.type) {
      case 'ThreadOpened':   return { kind: 'open', blockId: event.blockId };
      case 'ThreadResolved': return { kind: 'resolved' };
      default:               return state;
    }
  },
  decide(state, command, ctx) {
    switch (command.type) {
      case 'OpenThread':
        return state.kind === 'none' ? [ThreadOpened({ ...command, threadId: ctx.newId() })] : reject('thread already exists');
      case 'Reply':
        return state.kind === 'open' ? [ReplyPosted(command)] : reject('thread is not open');
      case 'ResolveThread':
        if (!ctx.flag('resolve-thread')) return reject('not enabled');
        if (state.kind !== 'open') return reject('thread is not open');       // resolved twice is a rejection, with a test
        return [ThreadResolved({ threadId: command.threadId, by: command.by }),
                DecisionRecorded({ ...command, blockId: state.blockId })];
    }
  },
};
```

`decide` is the only function with an `if`. `evolve` never throws. Both are plain data in, plain data out, so the expect test needs no mocks except `ctx` (clock, ids, flags), which the kernel simulates.

## Expect test

`packages/domain/thread/__expect__/resolve.expect.ts`. The kernel runs the stream through `evolve`, applies the command through `decide`, and snapshots the result as text. The snapshot is what a reviewer reads.

```ts
expectDecider(thread)
  .given(ThreadOpened({ threadId: 't7', blockId: 'b3', by: 'pratos', body: 'retries in client or wrapper?' }),
         ReplyPosted({ threadId: 't7', by: 'agent', body: 'wrapper: one place to change' }))
  .when(ResolveThread({ threadId: 't7', by: 'pratos', decision: 'wrapper' }))
  .snapshot();
```

```
given   ThreadOpened      t7 on b3 by pratos: "retries in client or wrapper?"
        ReplyPosted       t7 by agent: "wrapper: one place to change"
when    ResolveThread     t7 by pratos: "wrapper"
then    ThreadResolved    t7 by pratos
        DecisionRecorded  t7 on b3 by pratos: "wrapper"
```

And the rejection, which is also a test:

```
given   ThreadOpened … ThreadResolved t7 by pratos
when    ResolveThread  t7 by agent: "client"
then    rejected        thread is not open
```

If a snapshot is not something you could show the user and get a nod, it is the wrong test.

## The append, in the Durable Object

```ts
// packages/api/src/plan-room.ts  (one DO per Plan; its SQLite is the plan's log)
append(expectedVersion: number, events: Event[]) {
  const head = this.ctx.storage.sql.exec<{ v: number }>('SELECT COALESCE(MAX(version),0) AS v FROM events').one().v;
  if (head !== expectedVersion) throw new Conflict(head);
  let v = head;
  for (const e of events)            // synchronous: no await between writes, so all land or none
    this.ctx.storage.sql.exec('INSERT INTO events (version, type, at, by, data) VALUES (?,?,?,?,?)', ++v, e.type, e.at, e.by, JSON.stringify(e.data));
  this.broadcast(events);            // WebSocket fan-out to open tabs
  return v;
}
```

Projections that live in D1 subscribe to the same events and are rebuilt by `just replay <planId>`; they are never written to directly.

## What `just new command Name` produces

- `packages/schema/commands/Name.ts` with the command type and a domain vocabulary check.
- The `case 'Name':` in the aggregate's `decide`, returning `reject('todo')`.
- `__expect__/name.expect.ts` with a `given/when/snapshot` stub and one `rejected` stub.
- A line in `docs/DOMAIN-VOCABULARY.md` under the right noun, marked `(draft)` until the entry is written.
