// SQLite storage for pi-durable on Bun.
//
// pi-durable ships `openNodeSqliteStorage()` on `node:sqlite`, which Bun 1.3 does not have. The README says the
// portable core (`@earendil-works/pi-durable/storage/sqlite`) runs anywhere given an asynchronous `SqliteDatabase`
// facade (exec/run/get/all/transaction/close). This file is that facade over `bun:sqlite`, a port of the Node adapter:
// one connection, prepared statements cached by SQL text, a serial queue so a transaction holds the connection.
import { Database, type Statement } from "bun:sqlite";
import type { SqliteDatabase, SqliteExecutor, SqliteValue } from "@earendil-works/chord/sqlite";
import { SqliteStorage } from "@earendil-works/pi-durable/storage/sqlite";

export const DB_PATH = new URL("../agent.sqlite", import.meta.url).pathname;

/** Runs operations in call order; an async operation holds the queue until it settles. */
class SerialQueue {
  #tail: Promise<unknown> = Promise.resolve();
  #pending = 0;

  run<T>(operation: () => T): Promise<T> {
    if (this.#pending > 0) return this.#enqueue(operation);
    try {
      return Promise.resolve(operation());
    } catch (error) {
      return Promise.reject(error);
    }
  }

  runAsync<T>(operation: () => Promise<T>): Promise<T> {
    this.#pending++;
    const previous = this.#tail;
    const settled = previous.then(operation);
    this.#tail = settled.then(
      () => {
        this.#pending--;
      },
      () => {
        this.#pending--;
      },
    );
    return settled;
  }

  #enqueue<T>(operation: () => T): Promise<T> {
    this.#pending++;
    const settled = this.#tail.then(operation);
    this.#tail = settled.then(
      () => {
        this.#pending--;
      },
      () => {
        this.#pending--;
      },
    );
    return settled;
  }
}

type Scope = { active: boolean };

class BunExecutor implements SqliteExecutor {
  constructor(
    protected readonly db: Database,
    protected readonly statements: Map<string, Statement>,
    private readonly guard: () => void,
  ) {}

  exec(sql: string): Promise<void> {
    return this.operation(() => {
      this.db.exec(sql);
    });
  }
  run(sql: string, ...params: SqliteValue[]): Promise<void> {
    return this.operation(() => {
      this.statement(sql).run(...(params as never[]));
    });
  }
  get<T extends object>(sql: string, ...params: SqliteValue[]): Promise<T | undefined> {
    return this.operation(
      () => (this.statement(sql).get(...(params as never[])) as T | null) ?? undefined,
    );
  }
  all<T extends object>(sql: string, ...params: SqliteValue[]): Promise<T[]> {
    return this.operation(() => this.statement(sql).all(...(params as never[])) as T[]);
  }

  protected operation<T>(fn: () => T): Promise<T> {
    try {
      this.guard();
      return Promise.resolve(fn());
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private statement(sql: string): Statement {
    let statement = this.statements.get(sql);
    if (statement === undefined) {
      statement = this.db.prepare(sql);
      this.statements.set(sql, statement);
    }
    return statement;
  }
}

export class BunSqliteDatabase extends BunExecutor implements SqliteDatabase {
  readonly #queue = new SerialQueue();
  #closed = false;

  constructor(db: Database) {
    super(db, new Map(), () => {});
  }

  protected override operation<T>(fn: () => T): Promise<T> {
    return this.#queue.run(fn);
  }

  transaction<T>(callback: (transaction: SqliteExecutor) => Promise<T>): Promise<T> {
    return this.#queue.runAsync(async () => {
      this.db.exec("BEGIN IMMEDIATE");
      const scope: Scope = { active: true };
      const handle = new BunExecutor(this.db, this.statements, () => {
        if (!scope.active) throw new Error("SQLite transaction handle is no longer active");
      });
      try {
        const result = await callback(handle);
        scope.active = false;
        this.db.exec("COMMIT");
        return result;
      } catch (error) {
        scope.active = false;
        try {
          this.db.exec("ROLLBACK");
        } catch (rollbackError) {
          throw new AggregateError(
            [error, rollbackError],
            "SQLite transaction failed and rollback failed",
            { cause: rollbackError },
          );
        }
        throw error;
      }
    });
  }

  close(): Promise<void> {
    return this.#queue.run(() => {
      if (this.#closed) return;
      this.#closed = true;
      for (const statement of this.statements.values()) statement.finalize();
      this.statements.clear();
      try {
        this.db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
      } finally {
        this.db.close();
      }
    });
  }
}

/** Open (or create) the demo's SQLite file as pi-durable storage. Same pragmas as the Node adapter. */
export async function openStorage(path = DB_PATH): Promise<SqliteStorage> {
  const db = new Database(path, { create: true, strict: true });
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");
  return SqliteStorage.open(new BunSqliteDatabase(db));
}
