import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useEffect, useState } from 'react';
import type { PlanView } from '@greenhouse/schema';
import { apiGetOrStatus, apiCommand } from '#/lib/api';
import { rememberPlan } from '#/lib/recent-plans';
import { PlanEditor } from '#/components/PlanEditor';
import { savePlanText } from '#/lib/plan-text';
import { currentAccount } from '#/lib/session';

// Form fields are strings; a File here is a bug, so it reads as empty.
const field = (f: FormData, name: string): string => { const v = f.get(name); return typeof v === 'string' ? v : ''; };

// The plan page: threads on blocks, each ending in a decision. All data comes over the API binding; nothing here touches storage.
const loadPlan = createServerFn({ method: 'GET' })
  .validator((planId: string) => planId)
  .handler(({ data: planId }) => apiGetOrStatus<PlanView>(`/plans/${planId}`));

type Resolve = { planId: string; threadId: string; decision: string; by: string };
const resolveThread = createServerFn({ method: 'POST' })
  .validator((d: Resolve) => d)
  .handler(({ data }) => apiCommand(data.planId, 'ResolveThread', data.by, { threadId: data.threadId, decision: data.decision }));

type Open = { planId: string; blockId: string; body: string; by: string };
const openThread = createServerFn({ method: 'POST' })
  .validator((d: Open) => d)
  .handler(({ data }) => apiCommand(data.planId, 'OpenThread', data.by, { blockId: data.blockId, body: data.body }));

export const Route = createFileRoute('/plans/$planId')({
  loader: async ({ params }) => {
    const [r, { account }] = await Promise.all([loadPlan({ data: params.planId }), currentAccount()]);
    return { plan: r.data ?? null, status: r.status, account };
  },
  component: PlanGate,
});

// Plan rooms are for signed-in participants: signed out, the page says how to get in instead of failing.
function PlanGate() {
  const { plan, status } = Route.useLoaderData();
  const { planId } = Route.useParams();
  if (!plan) return <main className="mx-auto max-w-3xl px-4 py-10"><h1 className="text-2xl font-semibold tracking-tight">Plan {planId}</h1><p role="alert" className="mt-4 text-sm text-gray-500">{status === 401 ? <><Link to="/login" className="underline">Sign in</Link> to open this plan. Plans are for the people working on them.</> : status === 400 ? 'A plan id is 1 to 40 lowercase letters, digits or dashes.' : `This plan could not be opened (${status}).`}</p></main>;
  return <PlanPage />;
}

function PlanPage() {
  // Home lists the plans opened on this device; there is no plan index yet.
  const { planId: opened } = Route.useParams();
  useEffect(() => rememberPlan(opened), [opened]);
  const { plan: loaded, account } = Route.useLoaderData();
  const plan = loaded!;
  const { planId } = Route.useParams();
  const router = useRouter();
  // Comments are written as the signed-in account; the API sets `by` from the sign-in.
  const by = account?.accountId ?? '';
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<'connecting' | 'live' | 'off'>('connecting');

  // Multiplayer: subscribe to the plan's stream. Any append, by anyone, reloads this page's data.
  useEffect(() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/plans/${planId}/ws`);
    ws.onopen = () => setLive('live');
    ws.onclose = () => setLive('off');
    ws.onerror = () => setLive('off');
    ws.onmessage = (m) => { try { if (JSON.parse(String(m.data)).type === 'events') void router.invalidate(); } catch {} };
    return () => ws.close();
  }, [planId, router]);

  async function run<T extends { status: number; rejected?: string }>(p: Promise<T>) {
    setError(null);
    const r = await p;
    if (r.status >= 400) setError(r.rejected ?? `failed (${r.status})`);
    await router.invalidate();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Plan {planId}</h1>
        <p className="text-sm text-gray-500">as {by}</p>
      </header>
      <p className="mt-1 text-sm text-gray-500">{plan.threads.length} threads · {plan.decisions.length} decisions · version {plan.version} · <span data-live={live} className={live === 'live' ? 'text-emerald-700' : 'text-gray-400'}>{live === 'live' ? '● live' : live === 'off' ? '○ offline' : '○ connecting'}</span></p>
      {error && <p role="alert" className="mt-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}

      <div className="mt-8"><PlanEditor body={plan.body} onSave={(content, basedOn) => savePlanText(planId, by, content, basedOn)} /></div>
      <section className="mt-8 space-y-4">
        {plan.threads.map((t) => {
          const decision = plan.decisions.find((d) => d.threadId === t.threadId);
          return (
            <article key={t.threadId} data-thread={t.threadId} className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">block {t.blockId} · thread {t.threadId} · {t.replies} replies</p>
              <p className="mt-1 text-base">{t.body}</p>
              {decision ? (
                <p className="mt-3 text-sm text-emerald-800">Decided by {decision.by} · {decision.at.slice(0, 16).replace('T', ' ')} UTC · “{decision.decision}”</p>
              ) : (
                <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void run(resolveThread({ data: { planId, threadId: t.threadId, decision: field(f, 'decision'), by } })); }}>
                  <input name="decision" required placeholder="What was decided?" className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm" />
                  <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">Resolve</button>
                </form>
              )}
            </article>
          );
        })}
      </section>

      <form className="mt-10 flex flex-col gap-2 rounded-lg border border-dashed border-gray-300 p-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void run(openThread({ data: { planId, blockId: field(f, 'blockId'), body: field(f, 'body'), by } })); e.currentTarget.reset(); }}>
        <p className="text-sm font-medium">Open a thread</p>
        <div className="flex gap-2">
          <input name="blockId" required placeholder="block id" className="w-32 rounded border border-gray-300 px-3 py-2 text-sm" />
          <input name="body" required placeholder="What should we decide?" className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded border border-gray-300 px-3 py-2 text-sm">Open</button>
        </div>
      </form>
    </main>
  );
}
