import { Context, Effect, Layer } from 'effect';
import { Sql, WriteConflict, stmt, type Statement } from './sql';
import { handle, isRejection, type Ctx, type Decider, type Message, type Rejection } from './kernel';

// The event store. One table holds every stream; a stream is a string like `account-sam@greenhouse.test`.
// Appends are optimistic: the caller says which version it decided against, and the primary key (stream, version)
// turns a concurrent append into a WriteConflict. Projections are SQL statements derived from each event and written
// in the same transaction as the event, so a read model is never behind the log it came from.

export type Recorded<E extends Message = Message> = E & { stream: string; version: number; by: string; at: string };

export type Projection = {
  readonly name: string;
  readonly tables: ReadonlyArray<string>;            // CREATE TABLE IF NOT EXISTS …, applied by setup() or a migration
  on(event: Recorded): ReadonlyArray<Statement>;     // no reads: upserts, updates and deletes only
};

export const EVENTS_TABLE = 'CREATE TABLE IF NOT EXISTS stream_events (stream TEXT NOT NULL, version INTEGER NOT NULL, type TEXT NOT NULL, data TEXT NOT NULL, issued_by TEXT NOT NULL, recorded_at TEXT NOT NULL, PRIMARY KEY (stream, version))';

type Row = { stream: string; version: number; type: string; data: string; issued_by: string; recorded_at: string };
const fromRow = (r: Row): Recorded => ({ stream: r.stream, version: Number(r.version), type: r.type, data: JSON.parse(r.data), by: r.issued_by, at: r.recorded_at });

export class EventStore extends Context.Service<EventStore, {
  // Create the events table and every projection's tables. Tests and Durable Objects call it; D1 gets the same DDL as a migration.
  setup(): Effect.Effect<void>;
  read(stream: string): Effect.Effect<Recorded[]>;
  append(stream: string, expected: number, events: ReadonlyArray<Message>, meta: { by: string; at: string }): Effect.Effect<Recorded[], WriteConflict>;
  // Read the stream, decide, append against the version read. A conflict means someone else wrote first: read and decide again.
  execute<S, C extends Message, E extends Message>(decider: Decider<S, C, E>, stream: string, command: C, ctx: Ctx, by: string): Effect.Effect<Recorded<E>[] | Rejection, WriteConflict>;
}>()('greenhouse/engine/EventStore') {
  static readonly layer = (projections: ReadonlyArray<Projection>) => Layer.effect(EventStore, Effect.gen(function* () {
    const sql = yield* Sql;

    const read = (stream: string) =>
      sql.query<Row>('SELECT stream, version, type, data, issued_by, recorded_at FROM stream_events WHERE stream = ? ORDER BY version', [stream]).pipe(Effect.map((rows) => rows.map(fromRow)));

    const append = (stream: string, expected: number, events: ReadonlyArray<Message>, meta: { by: string; at: string }) => {
      const recorded: Recorded[] = events.map((e, i) => ({ ...e, stream, version: expected + i + 1, by: meta.by, at: meta.at }));
      const statements: Statement[] = [];
      for (const e of recorded) {
        statements.push(stmt('INSERT INTO stream_events (stream, version, type, data, issued_by, recorded_at) VALUES (?, ?, ?, ?, ?, ?)', e.stream, e.version, e.type, JSON.stringify(e.data), e.by, e.at));
        for (const p of projections) statements.push(...p.on(e));
      }
      return sql.atomically(statements).pipe(Effect.as(recorded));
    };

    const execute = <S, C extends Message, E extends Message>(decider: Decider<S, C, E>, stream: string, command: C, ctx: Ctx, by: string) => {
      const attempt = Effect.gen(function* () {
        const history = (yield* read(stream)) as unknown as Recorded<E>[];
        const result = handle(decider, history, command, ctx);
        if (isRejection(result)) return result;
        return (yield* append(stream, history.length, result, { by, at: ctx.now().toISOString() })) as unknown as Recorded<E>[];
      });
      // Three tries: a conflict on a busy stream is normal, three in a row is not.
      return attempt.pipe(
        Effect.catchTag('WriteConflict', () => attempt),
        Effect.catchTag('WriteConflict', () => attempt),
      );
    };

    return EventStore.of({
      setup: () => sql.atomically([EVENTS_TABLE, ...projections.flatMap((p) => p.tables)].map((ddl) => stmt(ddl))).pipe(Effect.orDie),
      read,
      append,
      execute,
    });
  }));
}
