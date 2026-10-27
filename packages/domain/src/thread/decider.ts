import { z } from 'zod';
import { Id, ParticipantId, Text } from '@greenhouse/schema';
import { defineCommand, defineEvent, reject, type Decider, type Message } from '../kernel';

// Commands: what a Participant asks, in the glossary's words.
export const OpenThread    = defineCommand('OpenThread',    z.object({ blockId: Id, by: ParticipantId, body: Text }));
export const Reply         = defineCommand('Reply',         z.object({ threadId: Id, by: ParticipantId, body: Text }));
export const ResolveThread = defineCommand('ResolveThread', z.object({ threadId: Id, by: ParticipantId, decision: Text }));

// Events: what happened. Never edited, never deleted.
export const ThreadOpened     = defineEvent('ThreadOpened',     z.object({ threadId: Id, blockId: Id, by: ParticipantId, body: Text }));
export const ReplyPosted      = defineEvent('ReplyPosted',      z.object({ threadId: Id, by: ParticipantId, body: Text }));
export const ThreadResolved   = defineEvent('ThreadResolved',   z.object({ threadId: Id, by: ParticipantId }));
export const DecisionRecorded = defineEvent('DecisionRecorded', z.object({ threadId: Id, blockId: Id, by: ParticipantId, decision: Text }));

export type ThreadCommand = ReturnType<typeof OpenThread> | ReturnType<typeof Reply> | ReturnType<typeof ResolveThread>;
export type ThreadEvent = ReturnType<typeof ThreadOpened> | ReturnType<typeof ReplyPosted> | ReturnType<typeof ThreadResolved> | ReturnType<typeof DecisionRecorded>;

// The invariants as a type: a thread is none, open on exactly one block, or resolved. Resolving twice is unrepresentable.
export type ThreadState = { kind: 'none' } | { kind: 'open'; blockId: string } | { kind: 'resolved' };

export const thread: Decider<ThreadState, ThreadCommand, ThreadEvent> = {
  initial: { kind: 'none' },
  evolve(state, event) {
    switch (event.type) {
      case 'ThreadOpened':   return { kind: 'open', blockId: event.data.blockId };
      case 'ThreadResolved': return { kind: 'resolved' };
      default:               return state;
    }
  },
  decide(state, command, ctx) {
    switch (command.type) {
      case 'OpenThread':
        if (state.kind !== 'none') return reject('thread already exists');
        return [ThreadOpened({ ...command.data, threadId: ctx.newId() })];
      case 'Reply':
        if (state.kind !== 'open') return reject('thread is not open');
        return [ReplyPosted(command.data)];
      case 'ResolveThread':
        if (!ctx.flag('resolve-thread')) return reject('resolve-thread is not enabled for this participant');
        if (state.kind !== 'open') return reject('thread is not open');
        return [
          ThreadResolved({ threadId: command.data.threadId, by: command.data.by }),
          DecisionRecorded({ threadId: command.data.threadId, blockId: state.blockId, by: command.data.by, decision: command.data.decision }),
        ];
    }
  },
};

export const threadKey = (m: Message): string | undefined => (m.data as { threadId?: string }).threadId;
