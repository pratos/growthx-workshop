import { z } from 'zod';
import type { PlanView, Thread, Decision } from '@greenhouse/schema';
import { handle, isRejection, type Ctx, type Message, type Rejection } from './kernel';
import { thread, threadKey, OpenThread, Reply, ResolveThread, type ThreadEvent } from './thread/decider';

export * from './kernel';
export * from './thread/decider';

export type Command = Message & { by: string };
export type DomainEvent = ThreadEvent;
export type StoredEvent = DomainEvent & { version: number; at: string; by: string };

// The wire shape of a command. `by` is the Participant issuing it; the api fills it from the session.
export const CommandEnvelope = z.object({
  type: z.enum(['OpenThread', 'Reply', 'ResolveThread']),
  data: z.record(z.string(), z.unknown()),
  by: z.string().min(1),
});

const commands = { OpenThread, Reply, ResolveThread } as const;

// Route a command to its aggregate: a Thread stream is the plan's events filtered to that thread.
export function route(history: readonly StoredEvent[], command: Command, ctx: Ctx): DomainEvent[] | Rejection {
  const make = commands[command.type as keyof typeof commands];
  if (!make) return { rejected: `unknown command ${command.type}` };
  let parsed;
  try { parsed = make({ ...(command.data as object), by: command.by } as never); } catch (e) { return { rejected: `invalid ${command.type}: ${e instanceof Error ? e.message : String(e)}` }; }
  const key = threadKey(parsed);
  const stream = key ? history.filter((e) => threadKey(e) === key) : [];
  const result = handle(thread, stream, parsed as never, ctx);
  return isRejection(result) ? result : result;
}

// A projection is a pure fold over the stream. Rebuilt on every read here; cached in D1 by `just replay` for cross-plan views.
export function project(events: readonly StoredEvent[]): PlanView {
  const threads = new Map<string, Thread>();
  const decisions: Decision[] = [];
  for (const e of events) {
    switch (e.type) {
      case 'ThreadOpened': threads.set(e.data.threadId, { threadId: e.data.threadId, blockId: e.data.blockId, openedBy: e.data.by, body: e.data.body, replies: 0, status: 'open' }); break;
      case 'ReplyPosted': { const t = threads.get(e.data.threadId); if (t) t.replies += 1; break; }
      case 'ThreadResolved': { const t = threads.get(e.data.threadId); if (t) t.status = 'resolved'; break; }
      case 'DecisionRecorded': decisions.push({ threadId: e.data.threadId, blockId: e.data.blockId, by: e.data.by, at: e.at, decision: e.data.decision }); break;
    }
  }
  return { threads: [...threads.values()], decisions, version: events.at(-1)?.version ?? 0 };
}
