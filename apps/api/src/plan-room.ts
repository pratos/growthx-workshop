import { DurableObject } from 'cloudflare:workers';
import { route, type Command, type DomainEvent, type Rejection, type StoredEvent, project } from '@greenhouse/domain';
import type { Env } from './services';

// One Durable Object per Plan. Its SQLite is the plan's event log: the system of record.
export class PlanRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    void ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS events (
        version INTEGER PRIMARY KEY, type TEXT NOT NULL, at TEXT NOT NULL, by TEXT NOT NULL, data TEXT NOT NULL)`);
    });
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
  private broadcast(events: StoredEvent[]) {
    const frame = JSON.stringify({ type: 'events', events });
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
