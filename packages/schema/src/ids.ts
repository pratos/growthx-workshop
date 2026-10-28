import { Schema } from 'effect';

// The ids and text every context shares (a shared kernel): no context's banned words apply here.
export const Id = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(64));
export const ParticipantId = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(64)); // a person or an agent; same commands, same rights
export const Text = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4000));
