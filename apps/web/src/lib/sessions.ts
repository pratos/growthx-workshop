import { createServerFn } from '@tanstack/react-start';
import type { SessionView } from '@greenhouse/schema';
import { apiGetOrStatus, apiPost } from '#/lib/api';

// Sessions on a plan, over the API binding as the signed-in account. The API sets `by` from the sign-in.
export const listSessions = createServerFn({ method: 'GET' })
  .validator((planId: string) => planId)
  .handler(({ data: planId }) => apiGetOrStatus<{ sessions: SessionView[] }>(`/plans/${encodeURIComponent(planId)}/sessions`));

type Command = { planId: string; type: string; data: Record<string, unknown> };
export const sessionCommand = createServerFn({ method: 'POST' })
  .validator((d: Command) => d)
  .handler(({ data: { planId, type, data } }) => apiPost<{ events?: unknown[]; rejected?: string }>(`/plans/${encodeURIComponent(planId)}/sessions`, { type, data }));
