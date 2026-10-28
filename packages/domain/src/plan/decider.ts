import { Schema } from 'effect';
import { ParticipantId, PlanContent } from '@greenhouse/schema';
import { defineCommand, defineEvent, reject, type Decider } from '../kernel';

// The Plan's text, edited by people in the editor and by the agent when it writes. Each save carries the whole text
// (the editor's JSON) and the edit it was based on; a save based on an older edit is refused, so nobody overwrites a
// change they never saw. Saving the same text again is a repeat and changes nothing.
export const EditPlan = defineCommand('EditPlan', { by: ParticipantId, content: PlanContent, basedOn: Schema.Int });
export const PlanEdited = defineEvent('PlanEdited', { by: ParticipantId, content: PlanContent });

export type PlanCommand = ReturnType<typeof EditPlan>;
export type PlanEvent = ReturnType<typeof PlanEdited>;
export type PlanState = { edits: number; content: string };

export const plan: Decider<PlanState, PlanCommand, PlanEvent> = {
  initial: { edits: 0, content: '' },
  evolve: (state, event) => (event.type === 'PlanEdited' ? { edits: state.edits + 1, content: event.data.content } : state),
  decide(state, command) {
    if (command.data.content === state.content) return [];
    if (command.data.basedOn !== state.edits) return reject(`the plan changed after edit ${command.data.basedOn}; it is at edit ${state.edits}. Reload and edit again`);
    return [PlanEdited({ by: command.data.by, content: command.data.content })];
  },
};
