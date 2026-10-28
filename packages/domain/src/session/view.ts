import { Effect } from 'effect';
import { Sql, stmt, type Projection } from '@greenhouse/engine';
import type { SessionView } from '@greenhouse/schema';

// The read side of agent work, written in the same transaction as the events.
export const sessionsView: Projection = {
  name: 'sessions',
  tables: [
    'CREATE TABLE IF NOT EXISTS sessions (session_id TEXT PRIMARY KEY, plan_id TEXT NOT NULL, title TEXT NOT NULL, started_by TEXT NOT NULL, status TEXT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS session_participants (session_id TEXT NOT NULL, participant TEXT NOT NULL, joined_at TEXT NOT NULL, PRIMARY KEY (session_id, participant))',
    'CREATE TABLE IF NOT EXISTS runs (run_id TEXT PRIMARY KEY, session_id TEXT NOT NULL, asked_by TEXT NOT NULL, asked TEXT NOT NULL, status TEXT NOT NULL, run_by TEXT, steers INTEGER NOT NULL DEFAULT 0, result TEXT, queued_at TEXT NOT NULL)',
  ],
  on(e) {
    const d = e.data as Record<string, string>;
    switch (e.type) {
      case 'SessionStarted': return [
        stmt('INSERT INTO sessions (session_id, plan_id, title, started_by, status) VALUES (?, ?, ?, ?, ?)', d.sessionId, d.planId, d.title, d.by, 'open'),
        stmt('INSERT INTO session_participants (session_id, participant, joined_at) VALUES (?, ?, ?), (?, ?, ?)', d.sessionId, d.by, e.at, d.sessionId, 'agent', e.at),
      ];
      case 'ParticipantJoined': return [stmt('INSERT INTO session_participants (session_id, participant, joined_at) VALUES (?, ?, ?)', d.sessionId, d.by, e.at)];
      case 'RunQueued':   return [stmt('INSERT INTO runs (run_id, session_id, asked_by, asked, status, queued_at) VALUES (?, ?, ?, ?, ?, ?)', d.runId, d.sessionId, d.by, d.asked, 'queued', e.at)];
      case 'RunStarted':  return [stmt("UPDATE runs SET status = 'running', run_by = ? WHERE run_id = ?", d.by, d.runId)];
      case 'RunSteered':  return [stmt('UPDATE runs SET steers = steers + 1 WHERE run_id = ?', d.runId)];
      case 'RunFinished': return [stmt("UPDATE runs SET status = 'finished', result = ? WHERE run_id = ?", d.result, d.runId)];
      case 'RunFailed':   return [stmt("UPDATE runs SET status = 'failed', result = ? WHERE run_id = ?", d.reason, d.runId)];
      case 'SessionEnded': return [stmt("UPDATE sessions SET status = 'ended' WHERE session_id = ?", d.sessionId)];
      default: return [];
    }
  },
};

type SessionRow = { session_id: string; plan_id: string; title: string; started_by: string; status: 'open' | 'ended' };
type RunRow = { run_id: string; session_id: string; asked_by: string; asked: string; status: 'queued' | 'running' | 'finished' | 'failed'; run_by: string | null; steers: number; result: string | null };

export const readSession = (sessionId: string) => Effect.gen(function* () {
  const sql = yield* Sql;
  const [s] = yield* sql.query<SessionRow>('SELECT session_id, plan_id, title, started_by, status FROM sessions WHERE session_id = ?', [sessionId]);
  if (!s) return undefined;
  const people = yield* sql.query<{ participant: string }>('SELECT participant FROM session_participants WHERE session_id = ? ORDER BY joined_at, participant', [sessionId]);
  const runs = yield* sql.query<RunRow>('SELECT run_id, session_id, asked_by, asked, status, run_by, steers, result FROM runs WHERE session_id = ? ORDER BY queued_at, run_id', [sessionId]);
  return {
    sessionId: s.session_id, planId: s.plan_id, title: s.title, startedBy: s.started_by, status: s.status,
    participants: people.map((p) => p.participant),
    runs: runs.map((r) => ({ runId: r.run_id, sessionId: r.session_id, askedBy: r.asked_by, asked: r.asked, status: r.status, ...(r.run_by ? { runBy: r.run_by } : {}), steers: Number(r.steers), ...(r.result ? { result: r.result } : {}) })),
  } satisfies SessionView;
});

// Every session in this store (one plan room holds one plan's sessions), oldest first.
export const listSessions = () => Effect.gen(function* () {
  const sql = yield* Sql;
  const ids = yield* sql.query<{ session_id: string }>("SELECT s.session_id FROM sessions s JOIN session_participants p ON p.session_id = s.session_id AND p.participant = s.started_by ORDER BY p.joined_at, s.session_id");
  const out: SessionView[] = [];
  for (const { session_id } of ids) { const v = yield* readSession(session_id); if (v) out.push(v); }
  return out;
});
