# The engine: `packages/engine`

Every write in Greenhouse goes through one small engine on Effect. Read this before adding a stream, a projection, or a test of a workflow.

## The pieces

| Piece | File | What it is |
|---|---|---|
| Decider kernel | `src/kernel.ts` | `defineCommand`, `defineEvent` (Effect Schema at the boundary), `Decider { initial, evolve, decide }`, `handle`, `replay`, and `expectDecider` for one-command expect tests |
| `Sql` | `src/sql.ts` | One Effect service: `query(sql, params)` and `atomically(statements)`. Statements use `?` placeholders in the SQL SQLite and Postgres share. A unique-key violation becomes a typed `WriteConflict` |
| Adapters | `src/adapters/*.ts` | `bunSqlite(db)` (tests, scripts; synchronous), `durableObject(storage)` (a plan room's own SQLite; synchronous, single writer), `d1(db)` (atomic through `batch`), `postgres(client)` (PGlite, `pg`, postgres.js) |
| `EventStore` | `src/store.ts` | `read(stream)`, `append(stream, expectedVersion, events, meta)`, `execute(decider, stream, command, ctx, by)` (read, decide, append, retry a conflict twice), `setup()`. One `stream_events` table holds every stream |
| Projections | given to `EventStore.layer([...])` | `{ name, tables, on(event) => Statement[] }`: SQL only, no reads, written in the same transaction as the event, so a read model is never behind its log |
| Story harness | `src/story.ts` | `story(layer, dir)`: a workflow test as a story, with `step(said, effect)`, `read(label, sql)`, `note(text)`, `snapshot(name)` |

## Rules

1. **One stream per aggregate instance**, named `<kind>-<id>`: `account-<email>`, `session-<id>`. A uniqueness rule (one account per email) is the stream key, so a race meets at the version.
2. **A projection is statements, never a read.** Upserts, updates and deletes derived from the event alone. If a projection needs state, the event is missing a field.
3. **D1 tables come from migrations**, not `setup()`. `apps/api/test/migrations.test.ts` checks the migration holds the same DDL as `EVENTS_TABLE` and the projection's `tables`, so they cannot drift.
4. **Hashing, tokens, the clock and ids come from outside `decide`.** The service hashes the password and passes `passwordMatched` and `tokenHash` in the command; `ctx` gives `now()` and `newId()`; tests fix both.
5. **Pick the adapter by where the stream lives**: a plan's sessions in its Durable Object (`durableObject`), accounts in D1 (`d1`), tests in memory (`bunSqlite(new Database(':memory:'))`), Postgres through Hyperdrive when it is chosen (`postgres`).

## Two kinds of expect test

- **One command** (`expectDecider`): given events, when a command, then events or a rejection. For a decider's rules. Snapshots in `__expect__/` next to the decider.
- **A workflow** (`story`): several steps through the real engine and real SQL, each printing what was asked and exactly the events it appended (found by diffing the log), then read models as rows. For sign-up and sign-in, sessions with several people and the agent, and the agent loop itself. Secrets print as `•••`; the clock and ids are fixed.

```text
when   Sam signs up as sam@greenhouse.test
then   AccountOpened      sam by sam email="sam@greenhouse.test" name="Sam" admin=false passwordHash=•••
when   someone signs up again with SAM@greenhouse.test
then   rejected           an account with this email exists
read   accounts           sam  sam@greenhouse.test  Sam  0
```

Real examples: `packages/domain/src/account/__expect__/`, `packages/domain/src/session/__expect__/`, `packages/agent/test/__expect__/`. `UPDATE_SNAPSHOTS=1 just test` accepts a changed story after you have read it.

## Tests of the engine itself

`packages/engine/test/store.test.ts` runs the same three tests on SQLite and Postgres (PGlite): execute decides and projects in one write; a stale append is a `WriteConflict` and changes nothing; an event whose projection fails is not recorded.
