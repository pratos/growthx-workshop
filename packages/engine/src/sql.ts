import { Context, Effect, Schema } from 'effect';

// One port for every database the engine runs on. Statements are plain SQL with `?` placeholders, written in the
// dialect SQLite and Postgres share (INSERT … ON CONFLICT … DO UPDATE, INTEGER for booleans, TEXT for JSON).
export type Statement = { readonly sql: string; readonly params: ReadonlyArray<unknown> };
export const stmt = (sql: string, ...params: unknown[]): Statement => ({ sql, params });

// Another append reached the stream first. The caller reads again and decides again.
export class WriteConflict extends Schema.TaggedError<WriteConflict>()('WriteConflict', { message: Schema.String }) {}

export class Sql extends Context.Service<Sql, {
  readonly dialect: 'sqlite' | 'postgres';
  query<R>(sql: string, params?: ReadonlyArray<unknown>): Effect.Effect<R[]>;
  // All statements land, or none do. A unique-key violation is a WriteConflict; anything else is a defect.
  atomically(statements: ReadonlyArray<Statement>): Effect.Effect<void, WriteConflict>;
}>()('greenhouse/engine/Sql') {}

const UNIQUE = /UNIQUE constraint failed|duplicate key value|SQLITE_CONSTRAINT|23505/i;
export const conflictOr = (e: unknown): WriteConflict | never => {
  const message = e instanceof Error ? e.message : String(e);
  if (UNIQUE.test(message)) return new WriteConflict({ message });
  throw e;
};
