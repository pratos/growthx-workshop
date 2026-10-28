import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import type { SessionView } from '@greenhouse/schema';
import { listSessions, sessionCommand } from '#/lib/sessions';

// The chat half of the plan: sessions where people ask the agent. Every step is an event in the plan room, so everyone
// here sees a question queue, the agent start, a steer arrive and the result land, as it happens.
type Props = { planId: string; me: string | null; tick: number };
const field = (f: FormData, name: string) => { const v = f.get(name); return typeof v === 'string' ? v.trim() : ''; };

export function SessionsPanel({ planId, me, tick }: Props) {
  const [sessions, setSessions] = useState<SessionView[] | null>(null);
  const [status, setStatus] = useState(200);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await listSessions({ data: planId });
    setStatus(r.status);
    if (r.data) { setSessions(r.data.sessions); setSelected((s) => s ?? r.data!.sessions.at(-1)?.sessionId ?? null); }
  }, [planId]);
  useEffect(() => { void refresh(); }, [refresh, tick, me]);

  async function send(type: string, data: Record<string, unknown>) {
    setError(null);
    const r = await sessionCommand({ data: { planId, type, data } });
    if (r.status >= 400) setError(r.rejected ?? `failed (${r.status})`);
    if (type === 'StartSession' && r.events?.[0]) setSelected((r.events[0] as { data: { sessionId: string } }).data.sessionId);
    await refresh();
  }

  if (!me || status === 401) {
    return (
      <aside className="gh-card p-5 lg:sticky lg:top-6" aria-label="Sessions">
        <h2 className="text-lg font-semibold">Talk to the agent</h2>
        <p className="gh-muted mt-2 text-sm"><Link to="/login" className="underline">Sign in</Link> to start a session or join one. Sessions are where you ask the agent, and everyone in the room sees each step.</p>
      </aside>
    );
  }

  const current = sessions?.find((s) => s.sessionId === selected) ?? null;
  const member = current?.participants.includes(me) ?? false;
  const running = current?.runs.find((r) => r.status === 'running');

  return (
    <aside className="gh-card flex flex-col gap-4 p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto" aria-label="Sessions">
      <header>
        <h2 className="text-lg font-semibold">Talk to the agent</h2>
        <p className="gh-muted mt-1 text-sm">Ask in a session; the agent answers one question at a time, in order. Anyone in the session can steer the question it is working on.</p>
      </header>
      {error && <p role="alert" className="gh-pill" data-tone="warn">{error}</p>}

      {sessions === null ? <p className="gh-muted text-sm">Loading sessions…</p> : sessions.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Sessions on this plan">
          {sessions.map((s) => (
            <li key={s.sessionId}>
              <button type="button" onClick={() => setSelected(s.sessionId)} aria-pressed={s.sessionId === selected} className="gh-btn !px-3 !py-1 !text-xs"
                style={s.sessionId === selected ? { borderColor: 'var(--lagoon)' } : { fontWeight: 500 }}>
                {s.title}{s.status === 'ended' ? ' · ended' : ''}
              </button>
            </li>
          ))}
        </ul>
      )}

      {current && (
        <section data-session={current.sessionId} className="flex flex-col gap-3">
          <p className="gh-muted text-xs">Started by {current.startedBy} · here: {current.participants.join(', ')}</p>
          {current.runs.length === 0 && <p className="gh-muted text-sm">No questions yet. Ask the first one below.</p>}
          <ol className="flex flex-col gap-2.5">
            {current.runs.map((r) => (
              <li key={r.runId} data-run={r.runId} data-status={r.status} className="gh-arrive flex flex-col gap-1.5">
                <p className="gh-bubble gh-bubble-asked"><span className="gh-kicker block !normal-case !tracking-normal">{r.askedBy} asked</span>{r.asked}</p>
                {r.status === 'queued' && <p className="gh-muted text-xs">Queued · the agent takes questions in order</p>}
                {r.status === 'running' && <p className="gh-muted gh-working text-xs">{r.runBy === 'agent' ? 'The agent is working on it' : `${r.runBy} is working on it`}{r.steers ? ` · steered ${r.steers}×` : ''}</p>}
                {r.status === 'finished' && <p data-result className="gh-bubble gh-bubble-answer gh-arrive"><span className="gh-kicker block !normal-case !tracking-normal">{r.runBy}{r.steers ? ` · steered ${r.steers}×` : ''}</span>{r.result}</p>}
                {r.status === 'failed' && <p data-result className="gh-bubble gh-bubble-failed gh-arrive"><span className="block text-[11px]">{r.runBy} could not answer</span>{r.result}</p>}
              </li>
            ))}
          </ol>

          {current.status === 'ended' ? <p className="gh-muted text-sm">This session has ended.</p> : !member ? (
            <button type="button" onClick={() => void send('JoinSession', { sessionId: current.sessionId })} className="gh-btn self-start">Join this session</button>
          ) : (
            <>
              {running && (
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void send('Steer', { sessionId: current.sessionId, runId: running.runId, steer: field(f, 'steer') }); e.currentTarget.reset(); }}>
                  <input name="steer" required aria-label="Steer the running question" placeholder="Steer the question it is working on…" className="gh-input" />
                  <button type="submit" className="gh-btn">Steer</button>
                </form>
              )}
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void send('Ask', { sessionId: current.sessionId, asked: field(f, 'asked') }); e.currentTarget.reset(); }}>
                <input name="asked" required aria-label="Ask the agent" placeholder="Ask the agent…" className="gh-input" />
                <button type="submit" className="gh-btn gh-btn-primary">Ask</button>
              </form>
              {current.startedBy === me && !running && (
                <button type="button" onClick={() => void send('EndSession', { sessionId: current.sessionId })} className="gh-muted self-start text-xs underline">End this session</button>
              )}
            </>
          )}
        </section>
      )}

      <form className="flex gap-2 border-t pt-4" style={{ borderColor: 'var(--line)' }} onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void send('StartSession', { title: field(f, 'title') }); e.currentTarget.reset(); }}>
        <input name="title" required aria-label="New session title" placeholder="New session: what is it about?" className="gh-input" />
        <button type="submit" className="gh-btn">Start</button>
      </form>
    </aside>
  );
}
