import { Id, ParticipantId, Text } from '@greenhouse/schema';
import { defineCommand, defineEvent, reject, type Decider } from '../kernel';

// Agent work. A Session belongs to a Plan; Participants join it and Ask; each Ask queues a Run; the agent (or anyone:
// the agent holds no command a person cannot issue) Starts the oldest queued Run, others can Steer it while it runs,
// and whoever started it Finishes it with a result, or Fails it with a reason. One Run at a time per Session.

export const AGENT = 'agent';

export const StartSession = defineCommand('StartSession', { sessionId: Id, planId: Id, by: ParticipantId, title: Text });
export const JoinSession  = defineCommand('JoinSession',  { sessionId: Id, by: ParticipantId });
export const Ask          = defineCommand('Ask',          { sessionId: Id, by: ParticipantId, asked: Text });
export const StartRun     = defineCommand('StartRun',     { sessionId: Id, runId: Id, by: ParticipantId });
export const Steer        = defineCommand('Steer',        { sessionId: Id, runId: Id, by: ParticipantId, steer: Text });
export const FinishRun    = defineCommand('FinishRun',    { sessionId: Id, runId: Id, by: ParticipantId, result: Text });
export const EndSession   = defineCommand('EndSession',   { sessionId: Id, by: ParticipantId });
// What a Participant says to the others in the Session. Mentioning @agent is an Ask instead (the page sends that).
export const PostMessage  = defineCommand('PostMessage',  { sessionId: Id, by: ParticipantId, body: Text });

export const SessionStarted    = defineEvent('SessionStarted',    { sessionId: Id, planId: Id, by: ParticipantId, title: Text });
export const ParticipantJoined = defineEvent('ParticipantJoined', { sessionId: Id, by: ParticipantId });
export const RunQueued         = defineEvent('RunQueued',         { sessionId: Id, runId: Id, by: ParticipantId, asked: Text });
export const RunStarted        = defineEvent('RunStarted',        { sessionId: Id, runId: Id, by: ParticipantId });
export const RunSteered        = defineEvent('RunSteered',        { sessionId: Id, runId: Id, by: ParticipantId, steer: Text });
export const RunFinished       = defineEvent('RunFinished',       { sessionId: Id, runId: Id, by: ParticipantId, result: Text });
export const SessionEnded      = defineEvent('SessionEnded',      { sessionId: Id, by: ParticipantId });
export const MessagePosted     = defineEvent('MessagePosted',     { sessionId: Id, messageId: Id, by: ParticipantId, body: Text });

export type SessionCommand = ReturnType<typeof StartSession> | ReturnType<typeof JoinSession> | ReturnType<typeof Ask> | ReturnType<typeof StartRun>
  | ReturnType<typeof Steer> | ReturnType<typeof FinishRun> | ReturnType<typeof EndSession> | ReturnType<typeof PostMessage>
  ;
export type SessionEvent = ReturnType<typeof SessionStarted> | ReturnType<typeof ParticipantJoined> | ReturnType<typeof RunQueued> | ReturnType<typeof RunStarted>
  | ReturnType<typeof RunSteered> | ReturnType<typeof RunFinished> | ReturnType<typeof SessionEnded> | ReturnType<typeof MessagePosted>
  ;

type RunState = { runId: string; status: 'queued' | 'running' | 'finished' | 'failed'; startedBy?: string };
export type SessionState =
  | { kind: 'none' }
  | { kind: 'open' | 'ended'; startedBy: string; participants: ReadonlyArray<string>; runs: ReadonlyArray<RunState> };

const setRun = (runs: ReadonlyArray<RunState>, runId: string, patch: Partial<RunState>) => runs.map((r) => (r.runId === runId ? { ...r, ...patch } : r));

export const session: Decider<SessionState, SessionCommand, SessionEvent> = {
  initial: { kind: 'none' },
  evolve(state, event) {
    if (event.type === 'SessionStarted') return { kind: 'open', startedBy: event.data.by, participants: [event.data.by, AGENT], runs: [] };
    if (state.kind === 'none') return state;
    switch (event.type) {
      case 'ParticipantJoined': return { ...state, participants: [...state.participants, event.data.by] };
      case 'RunQueued':         return { ...state, runs: [...state.runs, { runId: event.data.runId, status: 'queued' }] };
      case 'RunStarted':        return { ...state, runs: setRun(state.runs, event.data.runId, { status: 'running', startedBy: event.data.by }) };
      case 'RunFinished':       return { ...state, runs: setRun(state.runs, event.data.runId, { status: 'finished' }) };
      case 'SessionEnded':      return { ...state, kind: 'ended' };
      default:                  return state;
    }
  },
  decide(state, command, ctx) {
    if (command.type === 'StartSession') {
      if (state.kind !== 'none') return reject('session already exists');
      return [SessionStarted(command.data)];
    }
    if (state.kind === 'none') return reject('no such session');
    if (state.kind === 'ended') return reject('the session has ended');
    const { by } = command.data;
    const member = state.participants.includes(by);
    const running = state.runs.find((r) => r.status === 'running');
    switch (command.type) {
      case 'JoinSession':
        if (member) return reject(`${by} is already in this session`);
        return [ParticipantJoined(command.data)];
      case 'Ask':
        if (!member) return reject(`${by} has not joined this session`);
        return [RunQueued({ ...command.data, runId: ctx.newId() })];
      case 'StartRun': {
        if (!member) return reject(`${by} has not joined this session`);
        if (running) return reject(`one run at a time: ${running.runId} is running`);
        const next = state.runs.find((r) => r.status === 'queued');
        if (!next || next.runId !== command.data.runId) return reject(next ? `${next.runId} is next in the queue` : 'nothing is queued');
        return [RunStarted(command.data)];
      }
      case 'Steer':
        if (!member) return reject(`${by} has not joined this session`);
        if (running?.runId !== command.data.runId) return reject(`${command.data.runId} is not running`);
        return [RunSteered(command.data)];
      case 'FinishRun':
        if (running?.runId !== command.data.runId) return reject(`${command.data.runId} is not running`);
        if (running.startedBy !== by) return reject(`only ${running.startedBy}, who started ${running.runId}, can finish it`);
        return [RunFinished(command.data)];
      case 'PostMessage':
        if (!member) return reject(`${by} has not joined this session`);
        return [MessagePosted({ ...command.data, messageId: ctx.newId() })];
      case 'EndSession':
        if (by !== state.startedBy) return reject(`only ${state.startedBy}, who started the session, can end it`);
        if (running) return reject(`${running.runId} is still running`);
        return [SessionEnded(command.data)];
    }
  },
};

export const sessionStream = (sessionId: string) => `session-${sessionId}`;
