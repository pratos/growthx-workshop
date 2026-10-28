import { Effect, Layer } from 'effect';
import { Sql, conflictOr, type Statement } from '../sql';

// D1: SQLite over the network. No interactive transactions, but a batch is atomic, which is all an append needs:
// the event rows and the projection statements go in one batch.
type D1Bound = { all<R>(): Promise<{ results: R[] }> };
type D1 = { prepare(sql: string): { bind(...params: unknown[]): D1Bound }; batch(statements: D1Bound[]): Promise<unknown> };
export const d1 = (db: D1) => Layer.succeed(Sql, Sql.of({
  dialect: 'sqlite',
  query: <R>(sql: string, params: ReadonlyArray<unknown> = []) => Effect.promise(async () => (await db.prepare(sql).bind(...params).all<R>()).results),
  atomically: (statements: ReadonlyArray<Statement>) => statements.length === 0 ? Effect.void : Effect.tryPromise({
    try: () => db.batch(statements.map((s) => db.prepare(s.sql).bind(...s.params))),
    catch: conflictOr,
  }).pipe(Effect.asVoid),
}));
