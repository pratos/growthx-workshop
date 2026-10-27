import { z } from 'zod';

// The ubiquitous language, as types. Every word here is in docs/GLOSSARY.md. Nothing in code gets a noun that is not here.
export const Id = z.string().min(1).max(64);
export const ParticipantId = z.string().min(1).max(64);        // a person or an agent; same commands, same rights
export const Text = z.string().trim().min(1).max(4000);

export const Decision = z.object({
  threadId: Id, blockId: Id, by: ParticipantId, at: z.string(), decision: Text,
});
export type Decision = z.infer<typeof Decision>;

export const ThreadStatus = z.enum(['open', 'resolved']);
export const Thread = z.object({
  threadId: Id, blockId: Id, openedBy: ParticipantId, body: Text, replies: z.number().int(), status: ThreadStatus,
});
export type Thread = z.infer<typeof Thread>;

export const PlanView = z.object({ threads: z.array(Thread), decisions: z.array(Decision), version: z.number().int() });
export type PlanView = z.infer<typeof PlanView>;
