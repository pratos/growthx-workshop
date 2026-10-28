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
      <aside className="rounded-lg border border-gray-200 p-4" aria-label="Sessions">
        <h2 className="text-lg font-semibold">Talk to the agent</h2>
        <p className="mt-2 text-sm text-gray-500"><Link to="/login" className="underline">Sign in</Link> to start a session or join one. Sessions are where you ask the agent, and everyone in the room sees each step.</p>
      </aside>
    );
  }

  const current = sessions?.find((s) => s.sessionId === selected) ?? null;
  const member = current?.participants.includes(me) ?? false;
  const running = current?.runs.find((r) => r.status === 'running');

  return (
    <aside className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4" aria-label="Sessions">
      <header>
        <h2 className="text-lg font-semibold">Talk to the agent</h2>
        <p className="mt-1 text-sm text-gray-500">Ask in a session; the agent answers one question at a time, in order. Anyone in the session can steer the question it is working on.</p>
      </header>
      {error && <p role="alert" className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}

      {sessions === null ? <p className="text-sm text-gray-500">Loading sessions…</p> : sessions.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Sessions on this plan">
          {sessions.map((s) => (
            <li key={s.sessionId}>
              <button type="button" onClick={() => setSelected(s.sessionId)} aria-pressed={s.sessionId === selected}
                className={`rounded-full border px-3 py-1 text-xs ${s.sessionId === selected ? 'border-gray-900 font-semibold' : 'border-gray-300 text-gray-600'}`}>
                {s.title}{s.status === 'ended' ? ' · ended' : ''}
              </button>
            </li>
          ))}
        </ul>
      )}

      {current && (
        <section data-session={current.sessionId} className="flex flex-col gap-3">
          <p className="text-xs text-gray-500">Started by {current.startedBy} · in this session: {current.participants.join(', ')}</p>
          {current.runs.length === 0 && <p className="text-sm text-gray-500">No questions yet.</p>}
          <ol className="flex flex-col gap-3">
            {current.runs.map((r) => (
              <li key={r.runId} data-run={r.runId} data-status={r.status} className="flex flex-col gap-1">
                <p className="self-end rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-900"><span className="block text-[11px] text-gray-500">{r.askedBy} asked</span>{r.asked}</p>
                {r.status === 'queued' && <p className="text-xs text-gray-500">Queued · waiting for the agent</p>}
                {r.status === 'running' && <p className="text-xs text-gray-500">{r.runBy} is working on it{r.steers ? ` · steered ${r.steers}×` : ''}</p>}
                {r.status === 'finished' && <p data-result className="rounded-lg border border-gray-200 px-3 py-2 text-sm"><span className="block text-[11px] text-gray-500">{r.runBy}{r.steers ? ` · steered ${r.steers}×` : ''}</span>{r.result}</p>}
              </li>
            ))}
          </ol>

          {current.status === 'ended' ? <p className="text-sm text-gray-500">This session has ended.</p> : !member ? (
            <button type="button" onClick={() => void send('JoinSession', { sessionId: current.sessionId })} className="self-start rounded border border-gray-300 px-3 py-1.5 text-sm">Join this session</button>
          ) : (
            <>
              {running && (
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void send('Steer', { sessionId: current.sessionId, runId: running.runId, steer: field(f, 'steer') }); e.currentTarget.reset(); }}>
                  <input name="steer" required aria-label="Steer the running question" placeholder="Steer the question it is working on…" className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm" />
                  <button type="submit" className="rounded border border-gray-300 px-3 py-2 text-sm">Steer</button>
                </form>
              )}
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void send('Ask', { sessionId: current.sessionId, asked: field(f, 'asked') }); e.currentTarget.reset(); }}>
                <input name="asked" required aria-label="Ask the agent" placeholder="Ask the agent…" className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm" />
                <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">Ask</button>
              </form>
              {current.startedBy === me && !running && (
                <button type="button" onClick={() => void send('EndSession', { sessionId: current.sessionId })} className="self-start text-xs text-gray-500 underline">End this session</button>
              )}
            </>
          )}
        </section>
      )}

      <form className="flex gap-2 border-t border-gray-200 pt-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void send('StartSession', { title: field(f, 'title') }); e.currentTarget.reset(); }}>
        <input name="title" required aria-label="New session title" placeholder="New session: what is it about?" className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded border border-gray-300 px-3 py-2 text-sm">Start</button>
      </form>
    </aside>
  );
}
