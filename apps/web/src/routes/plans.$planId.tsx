import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useEffect, useState } from 'react';
import type { PlanView } from '@greenhouse/schema';
import { apiGetOrStatus, apiCommand } from '#/lib/api';
// <cp-10>
import { apiGet } from '#/lib/api';
// </cp-10>
import { rememberPlan } from '#/lib/recent-plans';
import { signInHref } from '#/lib/next';
import { ShareMenu, CopyLink } from '#/components/Share';
import { PlanEditor, WRITE_PREFIX } from '#/components/PlanEditor';
import { savePlanText } from '#/lib/plan-text';
import { askToWrite } from '#/lib/sessions';
import { currentAccount } from '#/lib/session';
import { SessionsPanel } from '#/components/SessionsPanel';

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
// The plan room's own event log, for the Events view: what was recorded, by whom, in order.
type LoggedEvent = { version: number; type: string; at: string; by: string; data: Record<string, unknown> };
const loadEvents = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(({ data: id }) => apiGetOrStatus<LoggedEvent[]>(`/plans/${id}/events`));

const openThread = createServerFn({ method: 'POST' })
  .validator((d: Open) => d)
  .handler(({ data }) => apiCommand(data.planId, 'OpenThread', data.by, { blockId: data.blockId, body: data.body }));

// <cp-10>
// Flags for the participant acting on the page: the resolve action shows only when resolve-thread is on for them.
const loadFlags = createServerFn({ method: 'GET' })
  .validator((by: string) => by)
  .handler(({ data: by }) => apiGet<{ participant: string; on: string[] }>(`/participants/${encodeURIComponent(by)}/flags`));
// </cp-10>

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
  if (!plan) return <main className="mx-auto max-w-3xl px-4 py-16"><h1 className="text-3xl font-semibold tracking-tight">{planId}</h1><p role="alert" className="gh-muted mt-4 text-sm">{status === 401 ? <><a href="/login" className="underline" onClick={(e) => { e.preventDefault(); window.location.assign(signInHref()); }}>Sign in</a> to open this plan. Plans are for the people working on them.</> : status === 400 ? 'A plan id is 1 to 40 lowercase letters, digits or dashes.' : `This plan could not be opened (${status}).`}</p></main>;
  return <PlanPage />;
}

function PlanPage() {
  // Home lists the plans opened on this device; there is no plan index yet.
  const { planId: opened } = Route.useParams();
  useEffect(() => rememberPlan(opened), [opened]);
  const [view, setView] = useState<'document' | 'decisions' | 'events'>('document');
  const { plan: loaded, account } = Route.useLoaderData();
  const plan = loaded!;
  const [sessionTick, setSessionTick] = useState(0);
  // Who has this plan open now, and the agent's answers while it writes them (both from the room's socket).
  const [here, setHere] = useState<string[]>([]);
  const [partials, setPartials] = useState<Record<string, string>>({});
  const { planId } = Route.useParams();
  const router = useRouter();
  // Comments are written as the signed-in account; the API sets `by` from the sign-in.
  const by = account?.accountId ?? '';
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<'connecting' | 'live' | 'off'>('connecting');
  // <cp-10>
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
  // </cp-10>

  // Multiplayer: subscribe to the plan's stream. Any append, by anyone, reloads this page's data.
  useEffect(() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/plans/${planId}/ws`);
    ws.onopen = () => setLive('live');
    ws.onclose = () => setLive('off');
    ws.onerror = () => setLive('off');
    ws.onmessage = (m) => {
      try {
        const frame = JSON.parse(String(m.data)) as { type?: string; here?: string[]; runId?: string; text?: string };
        if (frame.type === 'events') void router.invalidate();
        if (frame.type === 'session') { setSessionTick((n) => n + 1); setPartials({}); }
        if (frame.here) setHere(frame.here);
        if (frame.type === 'partial' && frame.runId) setPartials((p) => ({ ...p, [frame.runId!]: frame.text ?? '' }));
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
    <main className="gh-workspace">
      <SessionsPanel planId={planId} me={account?.accountId ?? null} tick={sessionTick} here={here} partials={partials} />
      <article className="gh-sheet" aria-label={`Plan ${planId}`}>
        <div className="gh-titlebar">
          <span className="gh-titlebar-title">{planId}</span>
          <span className="gh-titlebar-sep" aria-hidden="true" />
          <span className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="gh-pill">{plan.threads.length} thread{plan.threads.length === 1 ? '' : 's'}</span>
            <span className="gh-pill">version {plan.version}</span>
          </span>
          <span className="ml-auto flex items-center gap-3">
            <span className="flex -space-x-1.5" aria-label={`Here now: ${here.join(', ') || 'nobody'}`}>
              {here.map((who) => <span key={who} className="gh-face" data-agent={who === 'agent' || undefined} title={`${who}, here now`}>{who === 'agent' ? 'AI' : who.slice(0, 2).toUpperCase()}</span>)}
            </span>
            <span className="gh-pill" data-live={live} data-tone={live === 'live' ? 'live' : undefined}><span className="gh-dot" aria-hidden="true" />{live === 'live' ? 'Live' : live === 'off' ? 'Offline' : 'Connecting'}</span>
            <ShareMenu planId={planId} />
            <span className="gh-muted">as {by}</span>
          </span>
        </div>
        <div className="gh-views" role="tablist" aria-label="Plan views">
          <button type="button" role="tab" aria-selected={view === 'document'} className="gh-view" onClick={() => setView('document')}>Plan</button>
          <button type="button" role="tab" aria-selected={view === 'decisions'} className="gh-view" onClick={() => setView('decisions')}>Decisions <span className="tabular-nums">{plan.decisions.length}</span></button>
          <button type="button" role="tab" aria-selected={view === 'events'} className="gh-view" onClick={() => setView('events')}>Events <span className="tabular-nums">{plan.version}</span></button>
        </div>
        <div className="gh-doc">
          <h1>{planId}</h1>
          {error && <p role="alert" className="gh-pill mt-4" data-tone="warn">{error}</p>}
          {view === 'events' ? <EventLog planId={planId} version={plan.version} /> : view === 'decisions' ? (
            <section className="mt-8" aria-label="Decisions">
              {plan.decisions.length === 0 ? <p className="gh-muted text-sm">No decisions yet. A thread ends in one when someone resolves it.</p> : (
                <ol className="flex flex-col divide-y divide-[var(--ch-divider)]">
                  {plan.decisions.map((d) => {
                    const thread = plan.threads.find((t) => t.threadId === d.threadId);
                    return (
                      <li key={d.threadId} className="py-4" data-decision>
                        <p className="text-base">{d.decision}</p>
                        <p className="gh-meta mt-1"><span>{thread ? `On “${thread.body}”` : d.threadId}</span><span>{d.by}</span><span>{d.at.slice(0, 16).replace('T', ' ')} UTC</span></p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          ) : (
            <>
              <PlanEditor body={plan.body} onSave={(content, basedOn) => savePlanText(planId, by, content, basedOn)}
                onAsk={async (prompt) => { const refused = await askToWrite(planId, by, prompt, WRITE_PREFIX); setSessionTick((n) => n + 1); return refused; }} />
              <section className="mt-8 space-y-4" aria-label="Comment threads">
                {plan.threads.length === 0 && <p className="gh-muted text-sm">No threads on this plan yet. Open the first one below: a question about one block that should end in a decision.</p>}
                {plan.threads.map((t) => {
                  const decision = plan.decisions.find((d) => d.threadId === t.threadId);
                  return (
                    <article key={t.threadId} id={`thread-${t.threadId}`} data-thread={t.threadId} className="gh-card gh-arrive p-4">
                      <p className="gh-meta"><span>Block {t.blockId}</span><span>{t.replies} {t.replies === 1 ? 'reply' : 'replies'}</span><CopyLink path={`/plans/${planId}#thread-${t.threadId}`} label="Copy link to this thread" /></p>
                      <p className="mt-1.5 text-base font-medium">{t.body}</p>
                      {decision ? (
                        <div className="mt-3 text-sm" data-decision>
                          <p><span className="gh-pill" data-tone="live">Decided</span> <strong className="font-medium">“{decision.decision}”</strong></p>
                          <p className="gh-meta mt-1"><span>{decision.by}</span><span>{decision.at.slice(0, 16).replace('T', ' ')} UTC</span></p>
                        </div>
                      ) :
                      /* <cp-10> */
                      !canResolve ? (
                        <p className="gh-muted mt-3 text-sm" data-flag-off="resolve-thread">{flags === null ? 'Checking what you can do here…' : `Resolving threads is not switched on for ${by} yet.`}</p>
                      ) :
                      /* </cp-10> */
                      (
                        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void run(resolveThread({ data: { planId, threadId: t.threadId, decision: field(f, 'decision'), by } })); }}>
                          <input name="decision" required aria-label="What was decided" placeholder="What was decided?" className="gh-input" />
                          <button type="submit" className="gh-btn gh-btn-primary">Resolve</button>
                        </form>
                      )}
                    </article>
                  );
                })}
              </section>

              <form className="mt-10 flex flex-col gap-2 border-t pt-6" style={{ borderColor: 'var(--ch-divider)' }} onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void run(openThread({ data: { planId, blockId: field(f, 'blockId'), body: field(f, 'body'), by } })); e.currentTarget.reset(); }}>
                <h2>Open a thread</h2>
                <p className="gh-muted text-sm">A question about one block of the plan. It collects replies and ends in a decision.</p>
                <div className="mt-1 flex gap-2">
                  <input name="blockId" required aria-label="Block id" placeholder="Block id" className="gh-input !w-32" />
                  <input name="body" required aria-label="What should we decide" placeholder="What should we decide?" className="gh-input" />
                  <button type="submit" className="gh-btn">Open</button>
                </div>
              </form>
            </>
          )}
        </div>
      </article>
    </main>
  );
}

// Events: the plan room's log as recorded, newest first, for debugging what happened and in what order.
function EventLog({ planId, version }: { planId: string; version: number }) {
  const [events, setEvents] = useState<LoggedEvent[] | null>(null);
  const [status, setStatus] = useState(200);
  useEffect(() => { void loadEvents({ data: planId }).then((r) => { setStatus(r.status); setEvents(r.data ?? []); }); }, [planId, version]);
  if (events === null) return <p className="gh-muted mt-8 text-sm">Loading the event log…</p>;
  if (status >= 400) return <p role="alert" className="gh-muted mt-8 text-sm">The event log could not be read ({status}).</p>;
  if (events.length === 0) return <p className="gh-muted mt-8 text-sm">Nothing recorded on this plan yet.</p>;
  const brief = (d: Record<string, unknown>) => Object.entries(d).map(([k, v]) => `${k}=${typeof v === 'string' ? (v.length > 80 ? `${v.slice(0, 80)}…` : v) : JSON.stringify(v)}`).join('  ');
  return (
    <section className="mt-8" aria-label="Events">
      <p className="gh-muted text-sm">{events.length} events on this plan, newest first. Sessions keep their own streams in the same room.</p>
      <ol className="gh-events mt-4">
        {[...events].reverse().map((e) => (
          <li key={e.version}>
            <span className="tabular-nums">{e.version}</span>
            <span className="gh-event-type">{e.type}</span>
            <span>{e.by}</span>
            <span className="tabular-nums">{e.at.slice(0, 19).replace('T', ' ')}</span>
            <code>{brief(e.data)}</code>
          </li>
        ))}
      </ol>
    </section>
  );
}
