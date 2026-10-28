import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SessionView } from '@greenhouse/schema';
import { listSessions, sessionCommand } from '#/lib/sessions';
import { CopyLink } from '#/components/Share';

// The chat beside the plan. A Session is a conversation of Messages between people; mentioning @agent turns a message
// into an Ask, which the agent answers in a Run, streamed as it writes. Every step is an event in the plan room, so
// everyone here sees it as it happens. `here` is who has the plan open now; `partials` the answers being written.
type Props = { planId: string; me: string | null; tick: number; here?: readonly string[]; partials?: Readonly<Record<string, string>> };
type Line =
  | { kind: 'message'; at: string; id: string; by: string; body: string }
  | { kind: 'run'; at: string; run: SessionView['runs'][number] };

const AGENT = 'agent';
const initials = (who: string) => (who === AGENT ? 'AI' : who.slice(0, 2).toUpperCase());

function Face({ who, online }: { who: string; online?: boolean }) {
  return (
    <span className="gh-face" data-agent={who === AGENT || undefined} title={`${who}${online ? ', here now' : ''}`}>
      {initials(who)}{online && <span className="gh-face-dot" aria-hidden="true" />}
    </span>
  );
}

export function SessionsPanel({ planId, me, tick, here = [], partials = {} }: Props) {
  const [sessions, setSessions] = useState<SessionView[] | null>(null);
  const [status, setStatus] = useState(200);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [mention, setMention] = useState<{ query: string; index: number } | null>(null);
  const [palette, setPalette] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const r = await listSessions({ data: planId });
    setStatus(r.status);
    // A shared link can name the session (?session=…); otherwise the newest.
    const linked = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('session');
    if (r.data) { setSessions(r.data.sessions); setSelected((s) => s ?? (r.data!.sessions.some((x) => x.sessionId === linked) ? linked : r.data!.sessions.at(-1)?.sessionId ?? null)); }
  }, [planId]);
  useEffect(() => { void refresh(); }, [refresh, tick, me]);

  const current = sessions?.find((s) => s.sessionId === selected) ?? null;
  const lines: Line[] = useMemo(() => !current ? [] : [
    ...(current.messages ?? []).map((m) => ({ kind: 'message' as const, at: m.at, id: m.messageId, by: m.by, body: m.body })),
    ...current.runs.map((run) => ({ kind: 'run' as const, at: run.at ?? '', run })),
  ].sort((a, b) => a.at.localeCompare(b.at)), [current]);
  const streaming = Object.keys(partials).length;
  // ⌘K (Ctrl+K) switches chats, or starts one.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((v) => !v); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest' }); }, [lines.length, streaming]);

  async function command(type: string, data: Record<string, unknown>) {
    setError(null);
    const r = await sessionCommand({ data: { planId, type, data } }) as { status: number; events?: unknown[]; rejected?: string };
    if (r.status >= 400) setError(r.rejected ?? `failed (${r.status})`);
    const started = type === 'StartSession' ? (r.events?.[0] as { data?: { sessionId?: string } } | undefined)?.data?.sessionId : undefined;
    if (started) setSelected(started);
    return { ok: r.status < 400, started };
  }
  async function send(type: string, data: Record<string, unknown>) {
    const r = await command(type, data);
    await refresh();
    return r.ok;
  }
  async function startChat(title: string) {
    const r = await command('StartSession', { title: title.slice(0, 80) });
    await refresh();
    setPalette(false);
    return r.started;
  }

  if (!me || status === 401) {
    return (
      <aside className="gh-chat" aria-label="Sessions">
        <h2 className="text-lg font-semibold">Chat</h2>
        <p className="gh-muted mt-2 text-sm"><Link to="/login" className="underline">Sign in</Link> to talk with the others here and ask the agent.</p>
      </aside>
    );
  }

  const member = current?.participants.includes(me) ?? false;
  const running = current?.runs.find((r) => r.status === 'running');
  const people = current ? current.participants : [];
  const candidates = mention ? people.filter((p) => p !== me && p.startsWith(mention.query)) : [];

  function onDraft(value: string, caret: number) {
    setDraft(value);
    const m = /@([a-z0-9-]*)$/.exec(value.slice(0, caret));
    setMention(m ? { query: m[1] ?? '', index: 0 } : null);
  }
  function pick(who: string) {
    setDraft((d) => d.replace(/@([a-z0-9-]*)$/, `@${who} `));
    setMention(null);
  }
  async function submit() {
    const text = draft.trim();
    if (!text) return;
    // No chat yet: the first message starts one, named from its first words.
    const sessionId = current?.sessionId ?? await startChat(text.replace(/@\S+\s*/g, '').split(/\s+/).slice(0, 6).join(' ') || 'Chat');
    if (!sessionId) return;
    // Mentioning @agent asks the agent (a Run); anything else is a Message to the people in the session.
    const ok = /(^|\s)@agent\b/.test(text)
      ? await send('Ask', { sessionId, asked: text.replace(/(^|\s)@agent\b\s*/, '$1').trim() || text })
      : await send('PostMessage', { sessionId, body: text });
    if (ok) setDraft('');
  }

  const composerForm = (
  <form className="gh-composer" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
    {mention && candidates.length > 0 && (
      <div className="gh-slash gh-mentions" role="listbox" aria-label="Mention">
        {candidates.map((p, i) => (
          <button key={p} type="button" role="option" aria-selected={i === mention.index} className="gh-slash-item" onMouseDown={(ev) => { ev.preventDefault(); pick(p); }}>
            <span className="flex items-center gap-2"><Face who={p} />{p === AGENT ? 'agent' : p}</span>
            <span className="gh-slash-hint">{p === AGENT ? 'asks the agent' : here.includes(p) ? 'here now' : 'in this session'}</span>
          </button>
        ))}
      </div>
    )}
    <textarea value={draft} rows={2} aria-label="Message the chat" placeholder="Message the chat. Mention @agent to ask the agent."
      className="gh-input gh-composer-input"
      onChange={(e) => onDraft(e.target.value, e.target.selectionStart)}
      onKeyDown={(e) => {
        if (mention && candidates.length > 0) {
          if (e.key === 'ArrowDown') { e.preventDefault(); setMention({ ...mention, index: (mention.index + 1) % candidates.length }); return; }
          if (e.key === 'ArrowUp') { e.preventDefault(); setMention({ ...mention, index: (mention.index + candidates.length - 1) % candidates.length }); return; }
          if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(candidates[mention.index]!); return; }
          if (e.key === 'Escape') { setMention(null); return; }
        }
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit(); }
      }} />
    <div className="flex items-center justify-between gap-2">
      <span className="gh-meta">Enter sends. Shift+Enter for a new line.</span>
      <button type="submit" className="gh-btn gh-btn-primary" disabled={!draft.trim()}>Send</button>
    </div>
  </form>
  );

  return (
    <aside className="gh-chat" aria-label="Sessions">
      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Chat</h2>
          <button type="button" className="gh-chat-switch" onClick={() => setPalette(true)} aria-label="Switch chat">
            <span className="truncate">{current ? current.title : sessions?.length ? 'Pick a chat' : 'No chat yet'}</span><kbd>⌘K</kbd>
          </button>
        </div>
        <span className="flex -space-x-1.5" aria-label={`Here now: ${here.join(', ') || 'nobody'}`}>
          {here.map((who) => <Face key={who} who={who} online />)}
        </span>
      </header>
      {error && <p role="alert" className="gh-pill" data-tone="warn">{error}</p>}
      {palette && <ChatSwitcher sessions={sessions ?? []} selected={selected} onPick={(id) => { setSelected(id); setPalette(false); }} onStart={(t) => void startChat(t)} onClose={() => setPalette(false)} />}
      {!current && sessions !== null && (<>
        <p className="gh-muted text-sm">Say something to start a chat. Mention @agent to ask the agent.</p>
        {composerForm}
      </>)}

      {current && (
        <section data-session={current.sessionId} className="gh-thread">
          <div className="gh-members" aria-label="In this session">
            {people.map((p) => <Face key={p} who={p} online={here.includes(p)} />)}
            <span className="gh-meta">{people.length} in this chat</span>
            <span className="ml-auto"><CopyLink path={`/plans/${planId}?session=${current.sessionId}`} label="Copy link to this chat" /></span>
          </div>
          {lines.length === 0 && <p className="gh-muted text-sm">Nothing said yet. Say hello, or mention @agent to ask the agent.</p>}
          <ol className="flex flex-col gap-3">
            {lines.map((l) => l.kind === 'message' ? (
              <li key={l.id} className="gh-arrive gh-line" data-mine={l.by === me || undefined}>
                <Face who={l.by} />
                <div className="min-w-0"><p className="gh-meta"><span>{l.by}</span></p><p className="gh-said">{l.body}</p></div>
              </li>
            ) : (
              <li key={l.run.runId} data-run={l.run.runId} data-status={l.run.status} className="gh-arrive flex flex-col gap-2">
                <div className="gh-line" data-mine={l.run.askedBy === me || undefined}>
                  <Face who={l.run.askedBy} />
                  <div className="min-w-0"><p className="gh-meta"><span>{l.run.askedBy}</span><span>asked the agent</span></p><p className="gh-said"><span className="gh-mention">@agent</span> {l.run.asked}</p></div>
                </div>
                <div className="gh-line">
                  <Face who={AGENT} />
                  <div className="min-w-0">
                    {l.run.status === 'queued' && <p className="gh-meta">Queued. The agent takes questions in order.</p>}
                    {l.run.status === 'running' && (partials[l.run.runId]
                      ? <p className="gh-said gh-streaming" data-streaming>{partials[l.run.runId]}</p>
                      : <p className="gh-meta gh-working">{l.run.runBy === AGENT ? 'The agent is working on it' : `${l.run.runBy} is working on it`}{l.run.steers ? `, steered ${l.run.steers} time${l.run.steers === 1 ? '' : 's'}` : ''}</p>)}
                    {l.run.status === 'finished' && <p data-result className="gh-said gh-arrive">{l.run.result}</p>}
                    {l.run.status === 'failed' && <p data-result className="gh-said gh-failed gh-arrive"><span className="gh-meta !text-inherit">The agent could not answer</span>{l.run.result}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div ref={bottom} />

          {current.status === 'ended' ? <p className="gh-muted text-sm">This chat has ended.</p> : !member ? (
            <button type="button" onClick={() => void send('JoinSession', { sessionId: current.sessionId })} className="gh-btn self-start">Join this chat</button>
          ) : (
            <>
              {running && (
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get('steer'); if (typeof v === 'string' && v.trim()) void send('Steer', { sessionId: current.sessionId, runId: running.runId, steer: v.trim() }); e.currentTarget.reset(); }}>
                  <input name="steer" required aria-label="Steer the running question" placeholder="Steer what the agent is working on…" className="gh-input" />
                  <button type="submit" className="gh-btn">Steer</button>
                </form>
              )}
              {composerForm}
              {current.startedBy === me && !running && (
                <button type="button" onClick={() => void send('EndSession', { sessionId: current.sessionId })} className="gh-muted self-start text-xs underline">End this chat</button>
              )}
            </>
          )}
        </section>
      )}
    </aside>
  );
}

// ⌘K: switch to another chat on this plan, or start one named by what you typed.
function ChatSwitcher({ sessions, selected, onPick, onStart, onClose }: { sessions: SessionView[]; selected: string | null; onPick: (id: string) => void; onStart: (title: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const found = sessions.filter((s) => s.title.toLowerCase().includes(query.trim().toLowerCase()));
  const items = [...found.map((s) => ({ kind: 'chat' as const, s })), ...(query.trim() ? [{ kind: 'new' as const }] : [])];
  const choose = (i: number) => { const it = items[i]; if (!it) return; if (it.kind === 'chat') onPick(it.s.sessionId); else onStart(query.trim()); };
  return (
    <div className="gh-palette-backdrop" onMouseDown={onClose}>
      <div className="gh-palette" role="dialog" aria-label="Switch chat" onMouseDown={(e) => e.stopPropagation()}>
        <input autoFocus value={query} onChange={(e) => { setQuery(e.target.value); setIndex(0); }} aria-label="Find or start a chat" placeholder="Find a chat, or name a new one…" className="gh-palette-input"
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => (i + 1) % Math.max(items.length, 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => (i + items.length - 1) % Math.max(items.length, 1)); }
            if (e.key === 'Enter') { e.preventDefault(); choose(index); }
          }} />
        <div role="listbox" aria-label="Chats">
          {items.length === 0 && <p className="gh-slash-empty">No chats yet. Type a name to start one.</p>}
          {items.map((it, i) => (
            <button key={it.kind === 'chat' ? it.s.sessionId : 'new'} type="button" role="option" aria-selected={i === index} className="gh-slash-item" onMouseEnter={() => setIndex(i)} onClick={() => choose(i)}>
              {it.kind === 'chat'
                ? <><span>{it.s.title}</span><span className="gh-slash-hint">{it.s.sessionId === selected ? 'open now' : `${it.s.participants.length} in it${it.s.status === 'ended' ? ', ended' : ''}`}</span></>
                : <><span>Start “{query.trim()}”</span><span className="gh-slash-hint">a new chat</span></>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
