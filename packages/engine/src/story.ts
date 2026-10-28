import { Effect, Layer, ManagedRuntime } from 'effect';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Sql } from './sql';
import { describeMessage, isRejection } from './kernel';

// Expect tests for workflows: a story of steps through the real engine and real SQL, then the read models as rows.
//
//   when   Sam signs up as sam@greenhouse.test
//   then   AccountOpened      sam by sam email="sam@greenhouse.test" name="Sam" admin=false passwordHash=•••
//   when   Sam signs up again with the same email
//   then   rejected           an account with this email exists
//   read   accounts           sam  sam@greenhouse.test  Sam  admin=0
//
// Each step's `then` lists exactly the events that step appended, found by diffing the event table, so a step that
// writes nothing says so. The snapshot lives in __expect__/<name>.snap.txt next to the test.

type Row = { stream: string; version: number; type: string; data: string; issued_by: string };

export function story<R>(layer: Layer.Layer<R | Sql>, dir: string) {
  const runtime = ManagedRuntime.make(layer);
  const lines: string[] = [];
  const seen = new Set<string>();

  const appendedSince = () => runtime.runPromise(Effect.gen(function* () {
    const sql = yield* Sql;
    const rows = yield* sql.query<Row>('SELECT stream, version, type, data, issued_by FROM stream_events ORDER BY recorded_at, stream, version');
    const fresh = rows.filter((r) => !seen.has(`${r.stream}:${r.version}`));
    for (const r of fresh) seen.add(`${r.stream}:${r.version}`);
    return fresh.map((r) => { const data = JSON.parse(r.data) as Record<string, unknown>; return describeMessage({ type: r.type, data: { ...data, by: data.by ?? r.issued_by } }); });
  }));

  const api = {
    // Run one step. A typed failure or a Rejection value is part of the story, not a test failure.
    async step<A, E>(said: string, program: Effect.Effect<A, E, R | Sql>): Promise<A | undefined> {
      const outcome = await runtime.runPromise(program.pipe(
        Effect.map((value) => ({ ok: true as const, value })),
        Effect.catch((e: E) => Effect.succeed({ ok: false as const, error: e })),
      ));
      lines.push(`when   ${said}`);
      if (!outcome.ok) {
        const e = outcome.error as { _tag?: string; message?: string };
        lines.push(`then   rejected           ${e.message ?? e._tag ?? JSON.stringify(e)}`);
        await appendedSince();
        return undefined;
      }
      if (isRejection(outcome.value)) {
        lines.push(`then   rejected           ${outcome.value.rejected}`);
        await appendedSince();
        return undefined;
      }
      const events = await appendedSince();
      if (events.length === 0) lines.push('then   nothing recorded');
      events.forEach((e, i) => lines.push(`${i === 0 ? 'then  ' : '      '} ${e}`));
      return outcome.value;
    },
    // Print a read model, one row per line, columns joined by two spaces.
    async read(label: string, query: string, params: ReadonlyArray<unknown> = []) {
      const rows = await runtime.runPromise(Sql.use((sql) => sql.query<Record<string, unknown>>(query, params)));
      if (rows.length === 0) lines.push(`read   ${label.padEnd(18)} (none)`);
      rows.forEach((r, i) => lines.push(`${i === 0 ? `read   ${label.padEnd(18)}` : ' '.repeat(25)} ${Object.values(r).map((v) => (v === null ? '-' : typeof v === 'object' ? JSON.stringify(v) : String(v as string | number))).join('  ')}`));
    },
    note(text: string) { lines.push(`       — ${text}`); },
    run<A, E>(program: Effect.Effect<A, E, R | Sql>) { return runtime.runPromise(program); },
    get text() { return lines.join('\n') + '\n'; },
    snapshot(name: string) {
      const text = api.text;
      const file = join(dir, '__expect__', `${name}.snap.txt`);
      mkdirSync(join(dir, '__expect__'), { recursive: true });
      void runtime.dispose();
      if (!existsSync(file) || process.env.UPDATE_SNAPSHOTS) { writeFileSync(file, text); return text; }
      const expected = readFileSync(file, 'utf8');
      if (expected !== text) throw new Error(`expect story "${name}" changed.\n--- expected\n${expected}--- actual\n${text}(run with UPDATE_SNAPSHOTS=1 to accept)`);
      return text;
    },
  };
  return api;
}
