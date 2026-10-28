// Accounts as SQL for D1, produced by the engine itself: open each account in an in-memory SQLite through the real
// Accounts service, then print the event rows and the projection rows it wrote. So a seed or `just user-add` records
// AccountOpened exactly as a sign-up would, and D1 gets both the log and the read model.
import { Database } from 'bun:sqlite';
import { Effect, Layer } from 'effect';
import { EventStore } from '@greenhouse/engine';
import { bunSqlite } from '@greenhouse/engine/adapters/bun-sqlite';
import { Accounts, accountsView } from '@greenhouse/domain';

export type NewAccount = { email: string; name: string; password: string; admin: boolean };

const quote = (v: unknown) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${(typeof v === 'string' ? v : JSON.stringify(v)).replaceAll("'", "''")}'`);

export async function accountsSql(list: ReadonlyArray<NewAccount>, mode: 'seed' | 'add'): Promise<string> {
  const db = new Database(':memory:');
  const layer = Accounts.layer().pipe(Layer.provideMerge(EventStore.layer([accountsView]).pipe(Layer.provideMerge(bunSqlite(db)))));
  await Effect.runPromise(Effect.gen(function* () {
    yield* EventStore.use((s) => s.setup());
    for (const a of list) yield* Accounts.use((x) => x.open(a));
  }).pipe(Effect.provide(layer)));
  // A seed can run twice; adding an account that exists must fail loudly instead.
  const verb = mode === 'seed' ? 'INSERT OR IGNORE INTO' : 'INSERT INTO';
  const lines: string[] = [];
  for (const table of ['stream_events', 'accounts']) {
    for (const row of db.query(`SELECT * FROM ${table}`).all() as Record<string, unknown>[]) {
      lines.push(`${verb} ${table} (${Object.keys(row).join(', ')}) VALUES (${Object.values(row).map(quote).join(', ')});`);
    }
  }
  return lines.join('\n') + '\n';
}
