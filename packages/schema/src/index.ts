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
