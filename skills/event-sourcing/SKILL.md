---
name: event-sourcing
description: Build and change an event-sourced domain the Greenhouse way: commands validate, events are facts, projections are pure, every command has an expect test. Use for anything under packages/domain, for a new command, event or projection, for "add a field to an event", for replaying or debugging a stream, and for explaining what happened or how an aggregate's lifecycle works. Explains with viz-explainer artifacts (event-stream story, state explorer, decision report), never with Markdown.
---

# event-sourcing

Spreadsheets won because the data and its flow are visible. An event log gives a service the same property: the log of what happened is the system of record, and anyone, including the agent, can read it. This skill is the small set of rules that keep that true, and the way the log is explained back to a person.

## When this fires

- Any change under `packages/domain`, or to the append path in the plan-room Durable Object.
- A new command, event or projection. Start from `just new command|event|projection`, never from a blank file.
- "Add a field to", "rename", "change the shape of" anything that is already recorded.
- A bug report with a stream id: `just replay` first, then the failing expect test, then the fix.
- "What happened in plan X?", "how does a Thread move?", "should this be one event or two?"

## Rules

1. **Commands validate; events are facts.** A command may be rejected. An event is never rejected, edited or deleted. Past tense, domain vocabulary word (load `ddd-vocabulary` for the word).
2. **Decide, evolve, project.** `decide(state, command) → events[]` is the only place with rules. `evolve(state, event) → state` has none. `project(events) → readModel` is pure. Shape in `references/decider.md`.
3. **One command, one append.** Every event a command emits is appended in one synchronous block. In a Durable Object that means no `await` between the writes. Partial appends do not exist.
4. **Every command has an expect test.** Starting stream and command in, events out, snapshot read as prose. The scaffold writes the stub; the agent fills it; a human reviews the snapshot like a story. No unit tests of `evolve`, the snapshot already covers it.
5. **Invariants are types first, checks second.** "A decision references exactly one thread" is a schema. Only what cannot be a type becomes a `decide` check, and the check gets an expect test that shows the rejection.
6. **Flags live in `decide`.** A new command ships behind a flag, default off, checked in one place.
7. **The past is read, not rewritten.** Changing a recorded event climbs the ladder in `references/changing-events.md` from the bottom: avoid, map, upcast on read, new event type, transform. Never edit a schema in place for an event that exists in any store.
8. **Streams are short where they can be.** A Plan is one stream for the life of the work. A Thread opens and resolves within it in days. Frequent event changes mean the model is wrong, not the schema.
9. **Where the log lives.** One Durable Object per Plan holds that plan's log in its SQLite. D1 holds auth and cross-plan projections. Projections are rebuilt with `just replay`, never patched.
10. **Explain with the stream, not a paragraph.** Any explanation is a viz-explainer artifact built from a real snapshot or replay.

## Build sequence

1. **Name it** via `ddd-vocabulary`. Command imperative, events past tense, all in the domain vocabulary.
2. **Scaffold** with `just new command Name`. You get the schema stub, the `decide` case, and the expect stub.
3. **Write the expect test first.** The starting stream is a list of events; the expectation is the events that come out, or the rejection. Read it aloud. If it does not sound like something that happened, the model is wrong.
4. **Fill `decide`**, then `evolve` if state changed, then any projection.
5. **Run `just test`.** Expect tests in milliseconds, then the event-replay e2e through the API.
6. **If the change touches a recorded event**, stop and pick a rung on the ladder. Write the upcaster's expect test with a real old event from prod as input.
7. **If the change is a modelling choice** (one event or two, where a field lives), do not decide in prose. `just explore` both, and build a decision report. The resolve-thread plan in `docs/plans` shows this case: one record or two when a comment is resolved.
8. **Hand over** the snapshot and, if asked why, the artifact.

## Explain mode

Load `viz-explainer`. Pick one:

- **Event-stream story** for "what happened": one step per event, caption is the event read as prose, focus is the event and the projection it changed. Source: an expect snapshot or `just replay <stream>`. Conversion recipe and the worked example in `references/stream-to-artifact.md` and `assets/example-replay-story.html`.
- **State explorer** for "how does X move": `stateDiagram-v2` with transitions labelled by commands and notes naming the events. The viz-explainer template ships with the Thread lifecycle as its default.
- **Decision report** for "which model": each option's stream side by side, the four axes, the invariant each risks.

No Markdown explainer files. `docs/decisions/` holds the artifacts and a one-line index.

## Reference

- `references/decider.md`: the TypeScript shape, the expect test format, the Durable Object append, the scaffold's output.
- `references/changing-events.md`: the five-rung ladder with code for each.
- `references/stream-to-artifact.md`: snapshot or replay output to viz-explainer spec.
