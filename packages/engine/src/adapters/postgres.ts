import { Effect, Layer } from 'effect';
import { Sql, conflictOr, type Statement } from '../sql';

// Postgres, the option behind Hyperdrive. Any client with `query(text, params)` and `transaction(fn)` fits:
// PGlite as is, `pg` and postgres.js with a three-line wrapper. Placeholders are rewritten from ? to $1, $2, ….
type Query = { query<R>(text: string, params?: unknown[]): Promise<{ rows: R[] }> };
type Client = Query & { transaction<T>(fn: (tx: Query) => Promise<T>): Promise<T> };
const numbered = (sql: string) => { let n = 0; return sql.replace(/\?/g, () => `$${++n}`); };

export const postgres = (client: Client) => Layer.succeed(Sql, Sql.of({
  dialect: 'postgres',
  query: <R>(sql: string, params: ReadonlyArray<unknown> = []) => Effect.promise(async () => (await client.query<R>(numbered(sql), [...params])).rows),
  atomically: (statements: ReadonlyArray<Statement>) => Effect.tryPromise({
    try: () => client.transaction(async (tx) => { for (const s of statements) await tx.query(numbered(s.sql), [...s.params]); }),
    catch: conflictOr,
  }),
}));
