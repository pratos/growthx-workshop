import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import type { PlanView } from '@greenhouse/schema';
import { apiGet, apiCommand } from '#/lib/api';

// The plan page: threads on blocks, each ending in a decision. All data comes over the API binding; nothing here touches storage.
const loadPlan = createServerFn({ method: 'GET' })
  .validator((planId: string) => planId)
  .handler(({ data: planId }) => apiGet<PlanView>(`/plans/${planId}`));

type Resolve = { planId: string; threadId: string; decision: string; by: string };
const resolveThread = createServerFn({ method: 'POST' })
  .validator((d: Resolve) => d)
  .handler(({ data }) => apiCommand(data.planId, 'ResolveThread', data.by, { threadId: data.threadId, decision: data.decision }));

type Open = { planId: string; blockId: string; body: string; by: string };
const openThread = createServerFn({ method: 'POST' })
  .validator((d: Open) => d)
  .handler(({ data }) => apiCommand(data.planId, 'OpenThread', data.by, { blockId: data.blockId, body: data.body }));

export const Route = createFileRoute('/plans/$planId')({
  loader: ({ params }) => loadPlan({ data: params.planId }),
  component: PlanPage,
});

function PlanPage() {
  const plan = Route.useLoaderData();
  const { planId } = Route.useParams();
  const router = useRouter();
  const [by, setBy] = useState('pratos');
  const [error, setError] = useState<string | null>(null);

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
        <label className="text-sm text-gray-500">as <input value={by} onChange={(e) => setBy(e.target.value)} className="ml-1 w-28 rounded border border-gray-300 px-2 py-1 text-gray-900" /></label>
      </header>
      <p className="mt-1 text-sm text-gray-500">{plan.threads.length} threads · {plan.decisions.length} decisions · version {plan.version}</p>
      {error && <p role="alert" className="mt-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}

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
                <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void run(resolveThread({ data: { planId, threadId: t.threadId, decision: String(f.get('decision')), by } })); }}>
                  <input name="decision" required placeholder="What was decided?" className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm" />
                  <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">Resolve</button>
                </form>
              )}
            </article>
          );
        })}
      </section>

      <form className="mt-10 flex flex-col gap-2 rounded-lg border border-dashed border-gray-300 p-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void run(openThread({ data: { planId, blockId: String(f.get('blockId')), body: String(f.get('body')), by } })); e.currentTarget.reset(); }}>
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
