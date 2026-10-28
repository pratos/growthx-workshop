import { createServerFn } from '@tanstack/react-start';
import { apiCommand } from '#/lib/api';

// Saving the Plan's text: EditPlan over the API binding, as the signed-in account. A refusal because someone saved
// first is told apart from any other, so the editor can show their text instead.
type Edit = { planId: string; by: string; content: string; basedOn: number };
const editPlan = createServerFn({ method: 'POST' })
  .validator((d: Edit) => d)
  .handler(({ data }) => apiCommand(data.planId, 'EditPlan', data.by, { content: data.content, basedOn: data.basedOn }));

export async function savePlanText(planId: string, by: string, content: string, basedOn: number) {
  const r = (await editPlan({ data: { planId, by, content, basedOn } })) as { status: number; rejected?: unknown; events?: unknown };
  const rejected = typeof r.rejected === 'string' ? r.rejected : undefined;
  if (r.status < 400) return { ok: true as const, edits: basedOn + (Array.isArray(r.events) ? r.events.length : 0) };
  return { ok: false as const, stale: r.status === 409 && /changed after edit/.test(rejected ?? ''), rejected: rejected ?? `Not saved (${r.status}).` };
}
