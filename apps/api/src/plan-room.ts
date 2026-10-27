import { DurableObject } from 'cloudflare:workers';
import { route, type Command, type DomainEvent, type Rejection, type StoredEvent, project } from '@greenhouse/domain';

// One Durable Object per Plan. Its SQLite is the plan's event log: the system of record.
export class PlanRoom extends DurableObject {
  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
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
    return { events: stored };
  }
}
