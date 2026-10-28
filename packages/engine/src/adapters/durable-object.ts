import { Effect, Layer } from 'effect';
import { Sql, conflictOr, type Statement } from '../sql';

// A Durable Object's own SQLite: synchronous, and the object is the single writer for its streams.
type Storage = {
  sql: { exec(sql: string, ...params: unknown[]): { toArray(): unknown[] } };
  transactionSync<T>(fn: () => T): T;
};
export const durableObject = (storage: Storage) => Layer.succeed(Sql, Sql.of({
  dialect: 'sqlite',
  query: <R>(sql: string, params: ReadonlyArray<unknown> = []) => Effect.sync(() => storage.sql.exec(sql, ...params).toArray() as R[]),
  atomically: (statements: ReadonlyArray<Statement>) => Effect.try({
    try: () => storage.transactionSync(() => { for (const s of statements) storage.sql.exec(s.sql, ...s.params); }),
    catch: conflictOr,
  }),
}));
