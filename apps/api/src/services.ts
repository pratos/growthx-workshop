import { Context, Effect, Layer, ManagedRuntime } from 'effect';

// Everything behind the Hono edge is a service with a Layer. Hono handlers run programs through one ManagedRuntime per env.

// AUTH_LIMIT and WRITE_LIMIT are Workers rate-limit bindings (optional: tests and a bare `wrangler dev` run without them).
export type Env = { DB: D1Database; VERSION?: { id: string; tag: string }; GIT_DESCRIBE?: string; AUTH_LIMIT?: RateLimit; WRITE_LIMIT?: RateLimit };

// ---- Flags: which behaviours are on for a participant. Read once per request from D1; default off.

export class Flags extends Context.Service<Flags, {
  enabledFor(participant: string): Effect.Effect<ReadonlyArray<string>>;
}>()('greenhouse/api/Flags') {
  static readonly layer = (db: D1Database) => Layer.sync(Flags, () => {
    const enabledFor = Effect.fn('Flags.enabledFor')(function* (participant: string) {
      const { results } = yield* Effect.promise(() =>
        db.prepare('SELECT name, enabled, allowlist, percent FROM flags').all<{ name: string; enabled: number; allowlist: string | null; percent: number }>());
      const on: string[] = [];
      for (const f of results) {
        if (f.enabled) on.push(f.name);
        else if (f.allowlist && f.allowlist.split(',').map((s) => s.trim()).includes(participant)) on.push(f.name);
        else if (f.percent > 0 && bucket(participant, f.name) < f.percent) on.push(f.name);
      }
      return on;
    });
    return Flags.of({ enabledFor });
  });

  // Tests: a fixed set, or a function of the participant.
  static readonly layerTest = (on: ReadonlyArray<string> | ((p: string) => ReadonlyArray<string>)) =>
    Layer.succeed(Flags, Flags.of({ enabledFor: (p) => Effect.succeed(typeof on === 'function' ? on(p) : on) }));
}

// Stable 0..99 bucket per participant and flag, so a percentage rollout is deterministic per person.
export function bucket(participant: string, flag: string): number {
  let h = 2166136261;
  for (const ch of `${flag}:${participant}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h % 100;
}

// One runtime per Workers env object (stable per isolate), built lazily, shared by every handler.
const memoMap = Layer.makeMemoMapUnsafe();
const runtimes = new WeakMap<object, ManagedRuntime.ManagedRuntime<Flags, never>>();
export function runtimeFor(env: Env) {
  let rt = runtimes.get(env);
  if (!rt) {
    rt = ManagedRuntime.make(Flags.layer(env.DB), { memoMap });
    runtimes.set(env, rt);
  }
  return rt;
}
