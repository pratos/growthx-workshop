# Changing events people already recorded

The log is facts. An event-sourced product evolves by changing how events are read, not what was written. Climb from the bottom; the agent is told to stop at the first rung that works and to write the expect test for it with a real old event as input.

| Rung | When | What changes |
|---|---|---|
| 0 Avoid | The stream is short-lived or the change is cosmetic | Nothing. A Thread lives days; wait for it to resolve |
| 1 Simple mapping | New optional field, new field with a default, renamed field with the old JSON name kept | Schema only |
| 2 Upcast on read | Meaning is the same, shape differs, and a default can be computed | One function between store and `evolve`, registered per event type and version |
| 3 New event type | The meaning changed | A new fact with a new name; old projections keep working, new ones handle both |
| 4 Transform | Streams must be merged, split or cleaned | A one-off job that emits events, shipped in two phases |

## Rung 1, simple mapping

```ts
export const DecisionRecorded = defineEvent('DecisionRecorded', {
  threadId: Id, blockId: Id, by: ParticipantId, decision: Text,
  rationale: Text.optional(),            // new, optional: old events parse unchanged
});
```

## Rung 2, upcast on read

```ts
// packages/domain/upcast/DecisionRecorded.ts
upcaster('DecisionRecorded', 1, 2, (v1, stream) => ({
  ...v1,
  rationale: lastReplyBefore(stream, v1).body ?? '',   // defaulting from the stream, not from thin air
}));
```

Its expect test's `given` is a verbatim v1 event copied from prod, and the snapshot shows the v2 event it becomes. Upcasters are pure and run on every read, so they are cheap and never touch the store.

## Rung 3, new event type

`ThreadResolved` used to mean "closed, maybe with a decision". It now means "closed with a decision", and "closed without one" is a different fact: `ThreadAbandoned`. Both stay in the log. `evolve` handles both. The domain vocabulary gets a new entry first (`ddd-vocabulary`).

## Rung 4, transform

Phase one: ship code that reads both old and new streams. Phase two: a job replays old streams into new ones, emitting events with a `migratedFrom` reference. Phase three, a release later: delete the old read path. Never in one release.

## What the agent gets wrong without this

Asked to "add a rationale to decisions", it will edit the schema in place and make the field required, which breaks every replay of every existing plan. Rule 7 and this ladder exist so the expect tests fail before the deploy does.
