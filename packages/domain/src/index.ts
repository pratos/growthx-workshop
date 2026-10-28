// The domain's contexts: Identity from cp-03, comments and decisions from cp-05, sessions from cp-06.
export * from './kernel';
export * from './account/decider';
export * from './account/view';
export * from './account/accounts';
export * from './session/decider';
export * from './session/view';
import type { PlanBody, PlanView, Thread, Decision } from '@greenhouse/schema';
import { Schema } from 'effect';
import { handle, isRejection, type Ctx, type Message, type Rejection } from './kernel';
import { thread, threadKey, OpenThread, Reply, ResolveThread, type ThreadEvent } from './thread/decider';
import { plan, EditPlan, type PlanEvent } from './plan/decider';
export * from './thread/decider';
export * from './plan/decider';

export type Command = Message & { by: string };
export type DomainEvent = ThreadEvent | PlanEvent;
export type StoredEvent = DomainEvent & { version: number; at: string; by: string };

export { CommandEnvelope } from '@greenhouse/schema';

// Typed errors for the services in apps/api. The domain itself stays pure and returns a Rejection value.
export class CommandRejected extends Schema.TaggedError<CommandRejected>()('CommandRejected', { reason: Schema.String }) {}
export class InvalidCommand extends Schema.TaggedError<InvalidCommand>()('InvalidCommand', { type: Schema.String, message: Schema.String }) {}

const commands = { OpenThread, Reply, ResolveThread, EditPlan } as const;

// Route a command to its aggregate: the Plan's text is its PlanEdited events; a Thread stream is the plan's events
// filtered to that thread. Safe because one PlanRoom is the only writer.
export function route(history: readonly StoredEvent[], command: Command, ctx: Ctx): DomainEvent[] | Rejection {
  const make = commands[command.type as keyof typeof commands];
  if (!make) return { rejected: `unknown command ${command.type}` };
  let parsed;
  try { parsed = make({ ...(command.data as object), by: command.by } as never); } catch (e) { return { rejected: `invalid ${command.type}: ${e instanceof Error ? e.message : String(e)}` }; }
  if (parsed.type === 'EditPlan') return handle(plan, history.filter((e) => e.type === 'PlanEdited'), parsed as never, ctx);
  const key = threadKey(parsed);
  const stream = key ? history.filter((e) => threadKey(e) === key) : [];
  const result = handle(thread, stream as readonly ThreadEvent[], parsed as never, ctx);
  return isRejection(result) ? result : result;
}

// A projection is a pure fold over the stream. Rebuilt on every read here; cached in D1 by `just replay` for cross-plan views.
export function project(events: readonly StoredEvent[]): PlanView {
  const threads = new Map<string, { -readonly [K in keyof Thread]: Thread[K] }>();
  const decisions: Decision[] = [];
  let body: PlanBody = { content: '', edits: 0 };
  for (const e of events) {
    switch (e.type) {
      case 'PlanEdited': body = { content: e.data.content, edits: body.edits + 1, by: e.data.by, at: e.at }; break;
      case 'ThreadOpened': threads.set(e.data.threadId, { threadId: e.data.threadId, blockId: e.data.blockId, openedBy: e.data.by, body: e.data.body, replies: 0, status: 'open' }); break;
      case 'ReplyPosted': { const t = threads.get(e.data.threadId); if (t) t.replies += 1; break; }
      case 'ThreadResolved': { const t = threads.get(e.data.threadId); if (t) t.status = 'resolved'; break; }
      case 'DecisionRecorded': decisions.push({ threadId: e.data.threadId, blockId: e.data.blockId, by: e.data.by, at: e.at, decision: e.data.decision }); break;
    }
  }
  return { body, threads: [...threads.values()], decisions, version: events.at(-1)?.version ?? 0 };
}
