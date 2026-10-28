import { Hono } from 'hono';
import { Context, Effect, Layer, Schema } from 'effect';
import { ParticipantId } from '@greenhouse/schema';
import { runtimeFor, type Env } from './services';

// Flags admin: read and write the D1 `flags` table that `Flags.enabledFor` evaluates. Same shape as the other services:
// a Context.Service with a D1 layer and an in-memory test layer, Schema at the boundary, one typed error.

const FlagName = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(64));
const Percent = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 100 }));

// One row as the admin sees it: allowlist is a list of participant ids here, a comma-separated column in D1.
export const FlagRow = Schema.Struct({ name: FlagName, enabled: Schema.Boolean, allowlist: Schema.Array(ParticipantId), percent: Percent });
export type FlagRow = typeof FlagRow['Type'];

// What a PUT may carry: any subset of the three switches. A missing key keeps the stored value.
export const FlagPatch = Schema.Struct({
  enabled: Schema.optionalKey(Schema.Boolean),
  allowlist: Schema.optionalKey(Schema.Array(ParticipantId)),
  percent: Schema.optionalKey(Percent),
});
export type FlagPatch = typeof FlagPatch['Type'];

export class FlagInvalid extends Schema.TaggedError<FlagInvalid>()('FlagInvalid', { name: Schema.String, message: Schema.String }) {}

const decodeName = Schema.decodeUnknownEffect(FlagName);
const decodePatch = Schema.decodeUnknownEffect(FlagPatch);

// Validate a name and a patch, then merge the patch over what is stored (a flag not yet in the table starts off).
// Shared by the D1 layer and the test layer so both reject the same input.
const merge = Effect.fn('FlagsAdmin.merge')(function* (name: unknown, patch: unknown, current: FlagRow | undefined) {
  const invalid = (e: { message: string }) => new FlagInvalid({ name: String(name), message: e.message });
  const flagName = yield* decodeName(name).pipe(Effect.mapError(invalid));
  const p = yield* decodePatch(patch).pipe(Effect.mapError(invalid));
  const base: FlagRow = current ?? { name: flagName, enabled: false, allowlist: [], percent: 0 };
  return { name: flagName, enabled: p.enabled ?? base.enabled, allowlist: p.allowlist ?? base.allowlist, percent: p.percent ?? base.percent } satisfies FlagRow;
});

type Stored = { name: string; enabled: number; allowlist: string | null; percent: number };
const fromStored = (r: Stored): FlagRow => ({
  name: r.name,
  enabled: r.enabled !== 0,
  allowlist: r.allowlist ? r.allowlist.split(',').map((s) => s.trim()).filter((s) => s.length > 0) : [],
  percent: r.percent,
});

export class FlagsAdmin extends Context.Service<FlagsAdmin, {
  list(): Effect.Effect<ReadonlyArray<FlagRow>>;
  set(name: string, patch: unknown): Effect.Effect<FlagRow, FlagInvalid>;
}>()('greenhouse/api/FlagsAdmin') {
  static readonly layer = (db: D1Database) => Layer.sync(FlagsAdmin, () => {
    const list = Effect.fn('FlagsAdmin.list')(function* () {
      const { results } = yield* Effect.promise(() => db.prepare('SELECT name, enabled, allowlist, percent FROM flags ORDER BY name').all<Stored>());
      return results.map(fromStored);
    });
    const set = Effect.fn('FlagsAdmin.set')(function* (name: string, patch: unknown) {
      const current = yield* Effect.promise(() => db.prepare('SELECT name, enabled, allowlist, percent FROM flags WHERE name = ?1').bind(name).first<Stored>());
      const next = yield* merge(name, patch, current ? fromStored(current) : undefined);
      yield* Effect.promise(() =>
        db.prepare('INSERT INTO flags (name, enabled, allowlist, percent) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(name) DO UPDATE SET enabled = excluded.enabled, allowlist = excluded.allowlist, percent = excluded.percent')
          .bind(next.name, next.enabled ? 1 : 0, next.allowlist.length > 0 ? next.allowlist.join(',') : null, next.percent)
          .run());
      return next;
    });
    return FlagsAdmin.of({ list, set });
  });

  // Tests: the same validation and merge over a Map, no D1.
  static readonly layerTest = (initial: ReadonlyArray<FlagRow> = []) => Layer.sync(FlagsAdmin, () => {
    const rows = new Map(initial.map((f) => [f.name, f] as const));
    const list = () => Effect.sync(() => [...rows.values()].toSorted((a, b) => a.name.localeCompare(b.name)));
    const set = Effect.fn('FlagsAdmin.set')(function* (name: string, patch: unknown) {
      const next = yield* merge(name, patch, rows.get(name));
      rows.set(next.name, next);
      return next;
    });
    return FlagsAdmin.of({ list, set });
  });
}

// ---- The edge: a Hono sub-app mounted at /flags. Programs run through the shared runtime; the FlagsAdmin layer is provided per request from the env's D1.

export const flagsAdmin = new Hono<{ Bindings: Env }>();

flagsAdmin.get('/', async (c) => {
  const flags = await runtimeFor(c.env).runPromise(FlagsAdmin.use((f) => f.list()).pipe(Effect.provide(FlagsAdmin.layer(c.env.DB))));
  return c.json({ flags });
});

flagsAdmin.put('/:name', async (c) => {
  const name = c.req.param('name');
  const body = await c.req.json().catch(() => null);
  const outcome = await runtimeFor(c.env).runPromise(
    FlagsAdmin.use((f) => f.set(name, body)).pipe(
      Effect.map((flag) => ({ status: 200 as const, body: { flag } })),
      Effect.catchTag('FlagInvalid', (e) => Effect.succeed({ status: 400 as const, body: { rejected: `invalid flag ${e.name}: ${e.message}` } })),
      Effect.provide(FlagsAdmin.layer(c.env.DB)),
    ),
  );
  return c.json(outcome.body, outcome.status);
});
