import { test, expect, afterAll } from 'bun:test';
import { Database } from 'bun:sqlite';
import { PGlite } from '@electric-sql/pglite';
import { Effect, Exit, Layer } from 'effect';
import { EventStore, Sql, stmt, testCtx, defineCommand, defineEvent, reject, type Decider, type Projection } from '../src';
import { bunSqlite } from '../src/adapters/bun-sqlite';
import { postgres } from '../src/adapters/postgres';
import { Schema } from 'effect';

// The engine's two promises, on SQLite and on Postgres: a stale append conflicts instead of overwriting, and an
// event never lands without its projection (or the other way round).

const Add = defineCommand('Add', { n: Schema.Int });
const Added = defineEvent('Added', { n: Schema.Int });
const Boom = defineEvent('Boom', {});
const counter: Decider<number, ReturnType<typeof Add>, ReturnType<typeof Added>> = {
  initial: 0,
  evolve: (s, e) => s + e.data.n,
  decide: (s, c) => (s + c.data.n > 10 ? reject(`would pass 10 (at ${s})`) : [Added(c.data)]),
};
const totals: Projection = {
  name: 'totals',
  tables: ['CREATE TABLE IF NOT EXISTS totals (stream TEXT PRIMARY KEY, total INTEGER NOT NULL)'],
  on: (e) => e.type === 'Added'
    ? [stmt('INSERT INTO totals (stream, total) VALUES (?, ?) ON CONFLICT (stream) DO UPDATE SET total = totals.total + excluded.total', e.stream, (e.data as { n: number }).n)]
    : e.type === 'Boom' ? [stmt('INSERT INTO totals (stream, total) VALUES (?, NULL)', e.stream)] : [],
};

const pg = new PGlite();
afterAll(() => pg.close());
const databases = {
  sqlite: () => bunSqlite(new Database(':memory:')),
  postgres: () => postgres(pg),
};

const run = <A, E>(program: Effect.Effect<A, E, EventStore | Sql>, layer: Layer.Layer<EventStore | Sql>) => Effect.runPromiseExit(program.pipe(Effect.provide(layer)));

for (const [name, sqlLayer] of Object.entries(databases)) {
  const fresh = async () => {
    const layer = EventStore.layer([totals]).pipe(Layer.provideMerge(sqlLayer()));
    if (name === 'postgres') await pg.exec('DROP TABLE IF EXISTS stream_events; DROP TABLE IF EXISTS totals;');
    await run(EventStore.use((s) => s.setup()), layer);
    return layer;
  };
  const meta = { by: 'pratos', at: '2026-10-28T19:30:00.000Z' };
  const total = (layer: Layer.Layer<EventStore | Sql>) =>
    run(Sql.use((q) => q.query<{ total: number }>('SELECT total FROM totals')), layer)
      .then((e) => (Exit.isSuccess(e) ? e.value.map((r) => Number(r.total)) : e));

  test(`${name}: execute decides against the stream and projects in the same write`, async () => {
    const layer = await fresh();
    const ctx = testCtx();
    const results = [];
    for (const n of [4, 5, 3]) {
      const exit = await run(EventStore.use((s) => s.execute(counter, 'counter-a', Add({ n }), ctx, 'pratos')), layer);
      results.push(Exit.isSuccess(exit) ? ('rejected' in exit.value ? exit.value.rejected : exit.value.map((e) => `${e.type} ${e.data.n} v${e.version}`).join()) : 'failed');
    }
    expect(results).toEqual(['Added 4 v1', 'Added 5 v2', 'would pass 10 (at 9)']);
    expect(await total(layer)).toEqual([9]);
  });

  test(`${name}: a stale append is a WriteConflict and changes nothing`, async () => {
    const layer = await fresh();
    await run(EventStore.use((s) => s.append('counter-a', 0, [Added({ n: 1 })], meta)), layer);
    const stale = await run(EventStore.use((s) => s.append('counter-a', 0, [Added({ n: 5 })], meta)), layer);
    expect(Exit.isFailure(stale) && JSON.stringify(stale.cause).includes('WriteConflict')).toBe(true);
    const events = await run(EventStore.use((s) => s.read('counter-a')), layer);
    expect(Exit.isSuccess(events) && events.value.map((e) => (e.data as { n: number }).n)).toEqual([1]);
    expect(await total(layer)).toEqual([1]);
  });

  test(`${name}: an event whose projection fails is not recorded`, async () => {
    const layer = await fresh();
    const exit = await run(EventStore.use((s) => s.append('counter-b', 0, [Added({ n: 2 }), Boom({})], meta)), layer);
    expect(Exit.isFailure(exit)).toBe(true);
    const events = await run(EventStore.use((s) => s.read('counter-b')), layer);
    expect(Exit.isSuccess(events) && events.value).toEqual([]);
    expect(await total(layer)).toEqual([]);
  });
}
