import { Context, Effect, Layer, ManagedRuntime, Schema } from 'effect';
import { CommandEnvelope, type PlanView } from '@greenhouse/schema';
import { CommandRejected, InvalidCommand, type Command, type StoredEvent } from '@greenhouse/domain';
import type { PlanRoom } from './plan-room';

// Everything behind the Hono edge is a service with a Layer. Hono handlers run programs through one ManagedRuntime per env.

export type Env = { DB: D1Database; PLAN_ROOM: DurableObjectNamespace<PlanRoom>; VERSION?: { id: string; tag: string }; GIT_DESCRIBE?: string };

export class NotReady extends Schema.TaggedError<NotReady>()('NotReady', { dependency: Schema.String, message: Schema.String }) {}

// ---- Flags: which behaviours are on for a participant. Read once per request from D1; default off.

export class Flags extends Context.Service<Flags, {
  enabledFor(participant: string): Effect.Effect<ReadonlyArray<string>>;
}>()('greenhouse/api/Flags') {
  static readonly layer = (db: D1Database) => Layer.effect(Flags, Effect.gen(function* () {
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
  }));

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

// ---- PlanRooms: the event log, one Durable Object per Plan. The DO is the storage adapter; this service is its typed client.

export type DispatchResult = { events: StoredEvent[] } | { rejected: string };

export class PlanRooms extends Context.Service<PlanRooms, {
  dispatch(planId: string, command: Command, enabledFlags: ReadonlyArray<string>): Effect.Effect<DispatchResult>;
  events(planId: string): Effect.Effect<StoredEvent[]>;
  read(planId: string): Effect.Effect<PlanView>;
  ping(): Effect.Effect<number>;
}>()('greenhouse/api/PlanRooms') {
  static readonly layer = (ns: DurableObjectNamespace<PlanRoom>) => Layer.succeed(PlanRooms, PlanRooms.of({
    dispatch: (planId, command, flags) => Effect.promise(async () => (await ns.getByName(planId).dispatch(command, [...flags])) as DispatchResult),
    events: (planId) => Effect.promise(async () => (await ns.getByName(planId).events()) as StoredEvent[]),
    read: (planId) => Effect.promise(async () => (await ns.getByName(planId).read()) as PlanView),
    ping: () => Effect.promise(() => ns.getByName('readyz').version()),
  }));

  // Tests: the same decider over an in-memory log, no Durable Object.
  static readonly layerTest = Layer.effect(PlanRooms, Effect.gen(function* () {
    const { route, project } = yield* Effect.promise(() => import('@greenhouse/domain'));
    const logs = new Map<string, StoredEvent[]>();
    const log = (id: string) => logs.get(id) ?? (logs.set(id, []), logs.get(id)!);
    let n = 0;
    return PlanRooms.of({
      dispatch: (planId, command, flags) => Effect.sync(() => {
        const history = log(planId);
        const ctx = { newId: () => `id${++n}`, now: () => new Date('2026-10-28T19:30:00Z'), flag: (f: string) => flags.includes(f) };
        const result = route(history, command, ctx);
        if ('rejected' in result) return result;
        const stored = result.map((e, i) => ({ ...e, version: history.length + i + 1, at: ctx.now().toISOString(), by: command.by }) as StoredEvent);
        history.push(...stored);
        return { events: stored };
      }),
      events: (planId) => Effect.sync(() => [...log(planId)]),
      read: (planId) => Effect.sync(() => project(log(planId))),
      ping: () => Effect.succeed(0),
    });
  }));
}

// ---- Commands: the use case. Decode at the boundary, read flags, dispatch, turn a rejection into a typed error.

export class Commands extends Context.Service<Commands, {
  dispatch(planId: string, body: unknown): Effect.Effect<StoredEvent[], InvalidCommand | CommandRejected>;
}>()('greenhouse/api/Commands') {
  static readonly layerNoDeps = Layer.effect(Commands, Effect.gen(function* () {
    const flags = yield* Flags;
    const rooms = yield* PlanRooms;
    const decode = Schema.decodeUnknownEffect(CommandEnvelope);
    const dispatch = Effect.fn('Commands.dispatch')(function* (planId: string, body: unknown) {
      const envelope = yield* decode(body).pipe(Effect.mapError((e) => new InvalidCommand({ type: String((body as { type?: unknown })?.type ?? '?'), message: e.message })));
      const on = yield* flags.enabledFor(envelope.by);
      const result = yield* rooms.dispatch(planId, { type: envelope.type, data: envelope.data, by: envelope.by }, on);
      if ('rejected' in result) return yield* new CommandRejected({ reason: result.rejected });
      return result.events;
    });
    return Commands.of({ dispatch });
  }));

  static readonly layer = (env: Env) => this.layerNoDeps.pipe(Layer.provide(Layer.merge(Flags.layer(env.DB), PlanRooms.layer(env.PLAN_ROOM))));
  static readonly layerTest = (on: ReadonlyArray<string> | ((p: string) => ReadonlyArray<string>) = []) =>
    this.layerNoDeps.pipe(Layer.provideMerge(Layer.merge(Flags.layerTest(on), PlanRooms.layerTest)));
}

// ---- Readiness: touch each dependency, name the one that fails.

export const readiness = Effect.gen(function* () {
  const rooms = yield* PlanRooms;
  const version = yield* rooms.ping().pipe(Effect.mapError((e) => new NotReady({ dependency: 'planRoom', message: String(e) })));
  return { planRoom: 'ok', version };
});

// One runtime per Workers env object (stable per isolate), built lazily, shared by every handler.
const memoMap = Layer.makeMemoMapUnsafe();
const runtimes = new WeakMap<object, ManagedRuntime.ManagedRuntime<Commands | Flags | PlanRooms, never>>();
export function runtimeFor(env: Env) {
  let rt = runtimes.get(env);
  if (!rt) {
    rt = ManagedRuntime.make(Layer.merge(Commands.layer(env), Layer.merge(Flags.layer(env.DB), PlanRooms.layer(env.PLAN_ROOM))), { memoMap });
    runtimes.set(env, rt);
  }
  return rt;
}
