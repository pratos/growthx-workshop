import type { Database } from 'bun:sqlite';
import { Effect, Layer } from 'effect';
import { Sql, conflictOr, type Statement } from '../sql';

// bun:sqlite: synchronous, in-process. Tests use `new Database(':memory:')`; scripts use a file.
export const bunSqlite = (db: Database) => Layer.succeed(Sql, Sql.of({
  dialect: 'sqlite',
  query: <R>(sql: string, params: ReadonlyArray<unknown> = []) => Effect.sync(() => db.query(sql).all(...(params as never[])) as R[]),
  atomically: (statements: ReadonlyArray<Statement>) => Effect.try({
    try: () => db.transaction(() => { for (const s of statements) db.query(s.sql).run(...(s.params as never[])); })(),
    catch: conflictOr,
  }),
}));
