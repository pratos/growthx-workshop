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

// "/ask" in the editor: the question goes to the plan's open "Writing" session (started, or joined, if needed), worded
// so the agent writes its answer into the plan where the editor left "Asked the agent to write: …".
export async function askToWrite(planId: string, me: string, prompt: string, prefix: string): Promise<string | null> {
  type Sent = { status: number; events?: unknown[]; rejected?: string };
  const send = (type: string, data: Record<string, unknown>) => sessionCommand({ data: { planId, type, data } }) as Promise<Sent>;
  const listed = await listSessions({ data: planId });
  if (!listed.data) return `Sessions are not available here (${listed.status}).`;
  let session = listed.data.sessions.find((s) => s.title === 'Writing' && s.status === 'open');
  if (!session) {
    const started = await send('StartSession', { title: 'Writing' });
    const sessionId = (started.events?.[0] as { data?: { sessionId?: string } } | undefined)?.data?.sessionId;
    if (!sessionId) return started.rejected ?? 'Could not start a Writing session.';
    session = { sessionId, participants: [me] } as unknown as SessionView;
  } else if (!session.participants.includes(me)) {
    const joined = await send('JoinSession', { sessionId: session.sessionId });
    if (joined.rejected) return joined.rejected;
  }
  const asked = await send('Ask', { sessionId: session.sessionId, asked: `${prefix}${prompt}` });
  return asked.rejected ?? null;
}
