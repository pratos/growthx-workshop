import { Schema } from 'effect';
import { Id, ParticipantId, Text } from './ids';

// Agent work: Sessions, their Runs, and the Messages people post in them.
export const RunStatus = Schema.Literals(['queued', 'running', 'finished', 'failed']);
export const Run = Schema.Struct({ runId: Id, sessionId: Id, askedBy: ParticipantId, asked: Text, status: RunStatus, runBy: Schema.optionalKey(ParticipantId), steers: Schema.Int, result: Schema.optionalKey(Text), at: Schema.optionalKey(Schema.String) });
// What a Participant said to the others in a Session.
export const Message = Schema.Struct({ messageId: Id, by: ParticipantId, body: Text, at: Schema.String });
export type Message = typeof Message.Type;
export type Run = typeof Run.Type;
export const SessionView = Schema.Struct({
  sessionId: Id, planId: Id, title: Text, startedBy: ParticipantId, status: Schema.Literals(['open', 'ended']),
  participants: Schema.Array(ParticipantId), runs: Schema.Array(Run), messages: Schema.Array(Message),
});
export type SessionView = typeof SessionView.Type;
