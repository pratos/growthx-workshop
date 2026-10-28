import { test } from 'bun:test';
import { expectDecider } from '../kernel';
import { plan, EditPlan, PlanEdited } from './decider';

const expect = expectDecider(plan, import.meta.dir);
const draft = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Retries live in the wrapper."}]}]}';
const edited = PlanEdited({ by: 'pratos', content: draft });

test('the first edit of a plan', () => {
  expect.given().when(EditPlan({ by: 'pratos', content: draft, basedOn: 0 })).snapshot('first-edit');
});
test('an edit based on the latest one', () => {
  expect.given(edited).when(EditPlan({ by: 'agent', content: draft.replace('wrapper.', 'wrapper, three tries.'), basedOn: 1 })).snapshot('next-edit');
});
test('an edit based on an older one is refused', () => {
  expect.given(edited, PlanEdited({ by: 'sam', content: draft.replace('wrapper', 'client') })).when(EditPlan({ by: 'pratos', content: draft.replace('.', '!'), basedOn: 1 })).snapshot('stale-edit');
});
test('saving the same text again changes nothing', () => {
  expect.given(edited).when(EditPlan({ by: 'pratos', content: draft, basedOn: 1 })).snapshot('same-text');
});
