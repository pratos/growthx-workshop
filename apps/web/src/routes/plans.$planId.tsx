import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useEffect, useState } from 'react';
import type { PlanView } from '@greenhouse/schema';
import { apiGet, apiCommand } from '#/lib/api';
import { currentAccount } from '#/lib/session';
import { SessionsPanel } from '#/components/SessionsPanel';

// Form fields are strings; a File here is a bug, so it reads as empty.
const field = (f: FormData, name: string): string => { const v = f.get(name); return typeof v === 'string' ? v : ''; };

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

// Flags for the participant acting on the page: the resolve action shows only when resolve-thread is on for them.
const loadFlags = createServerFn({ method: 'GET' })
  .validator((by: string) => by)
  .handler(({ data: by }) => apiGet<{ participant: string; on: string[] }>(`/participants/${encodeURIComponent(by)}/flags`));

export const Route = createFileRoute('/plans/$planId')({
  loader: async ({ params }) => {
    const [plan, { account }] = await Promise.all([loadPlan({ data: params.planId }), currentAccount()]);
    return { plan, account };
  },
  component: PlanPage,
});

function PlanPage() {
  const { plan, account } = Route.useLoaderData();
  const [sessionTick, setSessionTick] = useState(0);
  const { planId } = Route.useParams();
  const router = useRouter();
  const [by, setBy] = useState('pratos');
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<'connecting' | 'live' | 'off'>('connecting');
  const [flags, setFlags] = useState<string[] | null>(null);

  // Ask which flags are on for whoever is acting, and again when they come back to the tab: a flag flipped in
  // production shows up without a deploy.
  useEffect(() => {
    let alive = true;
    const refresh = () => { if (by.trim()) void loadFlags({ data: by.trim() }).then((r) => { if (alive) setFlags(r.on); }, () => { if (alive) setFlags([]); }); };
    refresh();
    window.addEventListener('focus', refresh);
    return () => { alive = false; window.removeEventListener('focus', refresh); };
  }, [by]);
  const canResolve = flags?.includes('resolve-thread') ?? false;

  // Multiplayer: subscribe to the plan's stream. Any append, by anyone, reloads this page's data.
  useEffect(() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/plans/${planId}/ws`);
    ws.onopen = () => setLive('live');
    ws.onclose = () => setLive('off');
    ws.onerror = () => setLive('off');
    ws.onmessage = (m) => {
      try {
        const type = (JSON.parse(String(m.data)) as { type?: string }).type;
        if (type === 'events') void router.invalidate();
        if (type === 'session') setSessionTick((n) => n + 1);
      } catch {}
    };
    return () => ws.close();
  }, [planId, router]);

  async function run<T extends { status: number; rejected?: string }>(p: Promise<T>) {
    setError(null);
    const r = await p;
    if (r.status >= 400) setError(r.rejected ?? `failed (${r.status})`);
    await router.invalidate();
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Plan {planId}</h1>
        <label className="text-sm text-gray-500">as <input value={by} onChange={(e) => setBy(e.target.value)} className="ml-1 w-28 rounded border border-gray-300 px-2 py-1 text-gray-900" /></label>
      </header>
      <p className="mt-1 text-sm text-gray-500">{plan.threads.length} threads · {plan.decisions.length} decisions · version {plan.version} · <span data-live={live} className={live === 'live' ? 'text-emerald-700' : 'text-gray-400'}>{live === 'live' ? '● live' : live === 'off' ? '○ offline' : '○ connecting'}</span></p>
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
              ) : !canResolve ? (
                <p className="mt-3 text-sm text-gray-500" data-flag-off="resolve-thread">{flags === null ? 'Checking what you can do here…' : `Resolving threads is not switched on for ${by} yet.`}</p>
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
      </div>
      <SessionsPanel planId={planId} me={account?.accountId ?? null} tick={sessionTick} />
    </main>
  );
}
