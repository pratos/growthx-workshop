I reviewed the diff you pasted against the repo at HEAD (fa34267). The diff isn't in the working tree: `packages/domain` is unchanged locally, and the `__expect__` snapshots still show `ThreadResolved` + `DecisionRecorded`.

## 1. Words that aren't in the glossary

| Identifier | Where (new-file lines) | Why it's a defect |
|---|---|---|
| `ThreadClosed` (event and type) | `packages/domain/src/thread/decider.ts:13`, `:17`, `:27`, `:42`; `packages/domain/src/index.ts:42`; `thread.expect.test.ts:3`, `:19` | The glossary event for Thread is `ThreadResolved`. "Close" isn't one of the seven verbs. The GH-12 report already rejects this option: "Breaks the glossary: there is no ThreadClosed" (`docs/decisions/gh-12.spec.json:74`). |
| `verdict` (field) | `decider.ts:13`, `:42`; `thread.expect.test.ts:19` | The glossary lists it under Decision as **Not: verdict**. The code even copies `command.data.decision` into `verdict`, so the same thing has two names in one line. |

## 2. Code that runs but contradicts the rules

- **It edits recorded events.** `decider.ts:10` says events are "Never edited, never deleted". This change renames an event type and changes its schema. The fix is the upcast ladder that cp-03 used (`packages/domain/src/upcast/index.ts`), and this diff adds no upcaster.
- **The Decision no longer has its own event.** The glossary says `ResolveThread` produces `DecisionRecorded`, and that a Decision "stays attached to the Block it changed". Now the Decision is a text field on a thread event, and `ThreadClosed` has no `blockId`. So the Decision can't point at the Block it changed. That breaks the glossary's main promise: "every decision is owned, dated and attached to the block it changed."
- **The tests don't match their names.**
  - `'resolve records two facts'` now records one fact.
  - `'resolve twice is rejected'` now starts from a `ThreadClosed` event, so it no longer tests the history that is actually stored.
  - The diff doesn't touch `__expect__/resolve.snap.txt` or `resolve-twice.snap.txt`. Either `just test` fails, or someone re-saved the snapshots and they now describe the wrong behaviour.

## 3. Bugs

1. **Threads that are already resolved can be resolved again.** Streams that already exist hold `ThreadResolved`.
   - `evolve` (`decider.ts:24-29`) now drops `ThreadResolved` into `default: return state`, so the state stays `{ kind: 'open' }`. A second `ResolveThread` passes the `state.kind !== 'open'` guard and is accepted. This breaks "Cannot be resolved twice".
   - `project()` (`index.ts:42`) also ignores `ThreadResolved`, so every old resolved thread shows as `status: 'open'`.
2. **No new Decisions are recorded.** `ResolveThread` no longer emits `DecisionRecorded`, so `project()`'s `decisions` (`index.ts:43`) only ever holds old Decisions. The Decision log and the GH-12 report get nothing new. The cp-03 `DecisionRecorded` v1→v2 upcaster also stops mattering for anything written after this change.

## Question before merge

How are streams that already hold `ThreadResolved` and `DecisionRecorded` read after this change: upcast, migrated, or assumed not to exist? And which GH-12 option is this implementing, given the report itself marks this one as breaking the glossary?

Suggested next step: drop the rename, keep `ThreadResolved` + `DecisionRecorded`, and if a field needs to change, add it through an upcaster as cp-03 did.
exit 0
