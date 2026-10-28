import { DurableObject } from 'cloudflare:workers';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { EventStore, type Recorded } from '@greenhouse/engine';
import { durableObject } from '@greenhouse/engine/adapters/durable-object';
import { route, type Command, type DomainEvent, type Rejection, type StoredEvent, project } from '@greenhouse/domain';
import { session, sessionStream, sessionsView, readSession, StartSession, JoinSession, Ask, StartRun, Steer, FinishRun, EndSession } from '@greenhouse/domain';
import type { Env } from './services';

const sessionCommands = { StartSession, JoinSession, Ask, StartRun, Steer, FinishRun, EndSession } as const;
export type SessionResult = { events: Recorded[] } | Rejection;

// One Durable Object per Plan. Its SQLite is the plan's event log: the system of record.
export class PlanRoom extends DurableObject<Env> {
  // Sessions run on the engine over this object's own SQLite: synchronous, single writer, projections in the same transaction.
  private readonly sessions: ManagedRuntime.ManagedRuntime<EventStore, never>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sessions = ManagedRuntime.make(EventStore.layer([sessionsView]).pipe(Layer.provide(durableObject(ctx.storage))));
    void ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS events (
        version INTEGER PRIMARY KEY, type TEXT NOT NULL, at TEXT NOT NULL, by TEXT NOT NULL, data TEXT NOT NULL)`);
      await this.sessions.runPromise(EventStore.use((s) => s.setup()));
    });
  }

  // A Session command from a signed-in Participant. `by` comes from the sign-in, never from the body.
  async sessionCommand(planId: string, type: string, data: unknown, by: string): Promise<SessionResult> {
    const make = sessionCommands[type as keyof typeof sessionCommands];
    if (!make) return { rejected: `unknown command ${type}` };
    const fields = { ...(data as object), by, ...(type === 'StartSession' ? { planId, sessionId: crypto.randomUUID().slice(0, 8) } : {}) };
    let command;
    try { command = make(fields as never); } catch (e) { return { rejected: `invalid ${type}: ${e instanceof Error ? e.message : String(e)}` }; }
    const ctx = { newId: () => crypto.randomUUID().slice(0, 8), now: () => new Date(), flag: () => false };
    const result = await this.sessions.runPromise(EventStore.use((s) => s.execute(session, sessionStream(command.data.sessionId), command as never, ctx, by)));
    if ('rejected' in result) return result;
    this.broadcastFrame({ type: 'session', events: result });
    return { events: result };
  }

  async sessionView(sessionId: string) {
    return this.sessions.runPromise(readSession(sessionId).pipe(Effect.provide(durableObject(this.ctx.storage))));
  }

  version(): number {
    return this.ctx.storage.sql.exec<{ v: number }>('SELECT COALESCE(MAX(version),0) AS v FROM events').one().v;
  }

  events(): StoredEvent[] {
    return this.ctx.storage.sql.exec<{ version: number; type: string; at: string; by: string; data: string }>('SELECT * FROM events ORDER BY version')
      .toArray().map((r) => ({ version: r.version, type: r.type, at: r.at, by: r.by, data: JSON.parse(r.data) }) as StoredEvent);
  }

  read() {
    return project(this.events());
  }

  // Multiplayer: every open tab holds a hibernating WebSocket on this object. The DO is the one owner of the stream,
  // so it is also the one place that knows when the stream changed. Nothing else has to poll.
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('expected a websocket upgrade', { status: 426 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server);
    server.send(JSON.stringify({ type: 'hello', version: this.version() }));
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) { if (message === 'ping') ws.send('pong'); }
  webSocketClose(ws: WebSocket) { try { ws.close(); } catch {} }
  private broadcast(events: StoredEvent[]) { this.broadcastFrame({ type: 'events', events }); }
  private broadcastFrame(message: unknown) {
    const frame = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets()) { try { ws.send(frame); } catch {} }
  }

  // Validate through the decider, then append every resulting event in one synchronous block: all land or none.
  dispatch(command: Command & { by: string }, enabledFlags: string[]): { events: StoredEvent[] } | Rejection {
    const flags = new Set(enabledFlags);
    const history = this.events();
    const ctx = { newId: () => crypto.randomUUID().slice(0, 8), now: () => new Date(), flag: (n: string) => flags.has(n) };
    const result = route(history, command, ctx);
    if ('rejected' in result) return result;
    let v = this.version();
    const at = ctx.now().toISOString();
    const stored: StoredEvent[] = [];
    for (const e of result as DomainEvent[]) {
      const row = { version: ++v, type: e.type, at, by: command.by, data: e.data };
      this.ctx.storage.sql.exec('INSERT INTO events (version, type, at, by, data) VALUES (?,?,?,?,?)', row.version, row.type, row.at, row.by, JSON.stringify(row.data));
      stored.push(row as StoredEvent);
    }
    this.broadcast(stored);
    return { events: stored };
  }
}
