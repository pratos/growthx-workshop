import { Schema } from 'effect';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// A message is a type and validated data. Commands are imperative, what a Participant asks. Events are past tense, what happened.
export type Message<T extends string = string, D = unknown> = { type: T; data: D };

// Schema validates at the boundary; what comes out is a plain, typed message the pure functions below work on.
type Plain<F extends Schema.Struct.Fields> = Schema.Codec<Schema.Struct<F>['Type'], Schema.Struct<F>['Encoded'], never, never>;
function define<K extends 'command' | 'event', T extends string, F extends Schema.Struct.Fields>(kind: K, type: T, fields: F) {
  const schema = Schema.Struct(fields);
  const decode = Schema.decodeUnknownSync(schema as unknown as Plain<F>);   // domain fields never need services to decode
  const make = (data: Schema.Struct<F>['Encoded']): Message<T, Schema.Struct<F>['Type']> => ({ type, data: decode(data) });
  return Object.assign(make, { type, schema, kind });
}
export const defineCommand = <T extends string, F extends Schema.Struct.Fields>(type: T, fields: F) => define('command', type, fields);
export const defineEvent = <T extends string, F extends Schema.Struct.Fields>(type: T, fields: F) => define('event', type, fields);

export type Rejection = { rejected: string };
export const reject = (reason: string): Rejection => ({ rejected: reason });
export const isRejection = (x: unknown): x is Rejection => typeof x === 'object' && x !== null && 'rejected' in x;

export type Flags = { has(name: string): boolean };
export type Ctx = { newId(): string; now(): Date; flag(name: string): boolean };

// decide is the only function with rules. evolve has none. Both are data in, data out.
export interface Decider<State, C extends Message, E extends Message> {
  initial: State;
  evolve(state: State, event: E): State;
  decide(state: State, command: C, ctx: Ctx): E[] | Rejection;
}

export function replay<S, C extends Message, E extends Message>(d: Decider<S, C, E>, events: readonly E[]): S {
  return events.reduce((s, e) => d.evolve(s, e), d.initial);
}
export function handle<S, C extends Message, E extends Message>(d: Decider<S, C, E>, history: readonly E[], command: C, ctx: Ctx): E[] | Rejection {
  return d.decide(replay(d, history), command, ctx);
}

// ---- expect harness: given events, when command, then events. The snapshot is prose a reviewer reads like a story.

export function describeMessage(m: Message): string {
  const d = (m.data ?? {}) as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof d.threadId === 'string') parts.push(d.threadId);
  if (typeof d.blockId === 'string') parts.push(`on ${d.blockId}`);
  if (typeof d.by === 'string') parts.push(`by ${d.by}`);
  const quoted = ['body', 'decision', 'rationale'].filter((k) => typeof d[k] === 'string').map((k) => `${k === 'body' ? '' : k + ' '}"${d[k]}"`);
  const rest = Object.entries(d).filter(([k, v]) => !['threadId', 'blockId', 'by', 'body', 'decision', 'rationale'].includes(k) && v !== undefined).map(([k, v]) => `${k}=${JSON.stringify(v)}`);
  return `${m.type.padEnd(18)} ${[...parts, ...quoted, ...rest].join(' ')}`.trimEnd();
}

export const testCtx = (over: Partial<Ctx> = {}): Ctx => {
  let n = 0;
  return { newId: () => `id${++n}`, now: () => new Date('2026-10-28T19:30:00Z'), flag: () => true, ...over };
};

export function expectDecider<S, C extends Message, E extends Message>(d: Decider<S, C, E>, dir: string) {
  return {
    given(...events: E[]) {
      return {
        when(command: C, ctx: Ctx = testCtx()) {
          const result = handle(d, events, command, ctx);
          const lines = [
            ...events.map((e, i) => `${i === 0 ? 'given ' : '      '} ${describeMessage(e)}`),
            `when   ${describeMessage(command)}`,
            ...(isRejection(result) ? [`then   rejected           ${result.rejected}`] : result.map((e, i) => `${i === 0 ? 'then  ' : '      '} ${describeMessage(e)}`)),
          ];
          const text = lines.join('\n') + '\n';
          return {
            result,
            text,
            // Compare with __expect__/<name>.snap.txt; write it when missing or when UPDATE_SNAPSHOTS=1.
            snapshot(name: string) {
              const file = join(dir, '__expect__', `${name}.snap.txt`);
              mkdirSync(join(dir, '__expect__'), { recursive: true });
              if (!existsSync(file) || process.env.UPDATE_SNAPSHOTS) { writeFileSync(file, text); return text; }
              const expected = readFileSync(file, 'utf8');
              if (expected !== text) throw new Error(`expect snapshot "${name}" changed.\n--- expected\n${expected}--- actual\n${text}(run with UPDATE_SNAPSHOTS=1 to accept)`);
              return text;
            },
          };
        },
      };
    },
  };
}
