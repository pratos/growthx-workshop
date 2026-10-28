import { Schema } from 'effect';

// The ubiquitous language, as schemas. Every word here is in docs/DOMAIN-VOCABULARY.md. Nothing in code gets a noun that is not here.
export const Id = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(64));
export const ParticipantId = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(64)); // a person or an agent; same commands, same rights
export const Text = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4000));

export const Decision = Schema.Struct({ threadId: Id, blockId: Id, by: ParticipantId, at: Schema.String, decision: Text });
export type Decision = typeof Decision.Type;

export const ThreadStatus = Schema.Literals(['open', 'resolved']);
export const Thread = Schema.Struct({
  threadId: Id, blockId: Id, openedBy: ParticipantId, body: Text, replies: Schema.Int, status: ThreadStatus,
});
export type Thread = typeof Thread.Type;

export const PlanView = Schema.Struct({ threads: Schema.Array(Thread), decisions: Schema.Array(Decision), version: Schema.Int });
export type PlanView = typeof PlanView.Type;

// The wire shape of a command. `by` is the Participant issuing it; the api fills it from the session.
export const CommandEnvelope = Schema.Struct({
  type: Schema.Literals(['OpenThread', 'Reply', 'ResolveThread']),
  data: Schema.Record(Schema.String, Schema.Unknown),
  by: ParticipantId,
});
export type CommandEnvelope = typeof CommandEnvelope.Type;

// ---- Identity: who can sign in. An Account's id is the ParticipantId its commands carry.
export const Email = Schema.String.check(Schema.isMinLength(3), Schema.isMaxLength(254), Schema.isPattern(/^[^@\s]+@[^@\s]+$/));
export const Name = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(80));
export const Secret = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(512)); // a hash, never a password
export const Account = Schema.Struct({ accountId: ParticipantId, email: Email, name: Name, admin: Schema.Boolean });
export type Account = typeof Account.Type;

// ---- Agent work: a Session is where Participants ask the agent and its Runs happen. Becomes the agent's Thread at the rename.
export const RunStatus = Schema.Literals(['queued', 'running', 'finished', 'failed']);
export const Run = Schema.Struct({ runId: Id, sessionId: Id, askedBy: ParticipantId, asked: Text, status: RunStatus, runBy: Schema.optionalKey(ParticipantId), steers: Schema.Int, result: Schema.optionalKey(Text) });
export type Run = typeof Run.Type;
export const SessionView = Schema.Struct({
  sessionId: Id, planId: Id, title: Text, startedBy: ParticipantId, status: Schema.Literals(['open', 'ended']),
  participants: Schema.Array(ParticipantId), runs: Schema.Array(Run),
});
export type SessionView = typeof SessionView.Type;
