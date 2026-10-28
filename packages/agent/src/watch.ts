// Watches the demo's SQLite file from a second process and prints each entry as it is committed, plus task status
// changes. It opens the file read-only with bun:sqlite and polls; it does not open a Harness, because pi-durable says
// one process owns a storage at a time and a Harness view only advances from its own process's commits. SQLite WAL
// allows this reader next to the writer.
import { existsSync } from "node:fs";
import { Database } from "bun:sqlite";
import { DB_PATH } from "./storage.ts";
import { stamp, summarize } from "./summary.ts";

const POLL_MS = 200;
const log = (line: string) => console.log(`${stamp()} ${line}`);

type EntryRow = { id: number; commit_seq: number; record: string };
type TaskRow = { id: number; kind: string; status: string; record: string };
type SubmissionRow = { id: number; request_id: string | null; status: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

log(`watching ${DB_PATH} (ctrl-c to stop)`);
while (!existsSync(DB_PATH)) await sleep(POLL_MS);

let db: Database | undefined;
while (db === undefined) {
  try {
    const candidate = new Database(DB_PATH, { readonly: true, strict: true });
    candidate.exec("PRAGMA busy_timeout = 2000");
    candidate.query("SELECT 1 FROM entries LIMIT 1").get();
    db = candidate;
  } catch {
    await sleep(POLL_MS); // the writer has not created the schema yet
  }
}

const entriesAfter = db.query<EntryRow, [number]>(
  "SELECT id, commit_seq, record FROM entries WHERE id > ? ORDER BY id",
);
const tasks = db.query<TaskRow, []>("SELECT id, kind, status, record FROM tasks ORDER BY id");
const submissions = db.query<SubmissionRow, []>(
  "SELECT id, request_id, status FROM submissions ORDER BY id",
);

let lastEntry = 0;
const taskStatus = new Map<number, string>();
const submissionStatus = new Map<number, string>();
// The `kind` and `request_id` columns hold JSON-encoded strings (with quotes); records are JSON too.
const unquote = (value: string) => (value.startsWith('"') ? (JSON.parse(value) as string) : value);

for (;;) {
  try {
    for (const row of entriesAfter.all(lastEntry)) {
      lastEntry = row.id;
      const entry = JSON.parse(row.record) as { kind: string; model?: never[]; data?: unknown };
      log(
        `entry  #${row.id} commit ${row.commit_seq}  ${entry.kind.padEnd(15)} ${summarize({ id: row.id, ...entry })}`,
      );
    }
    for (const row of tasks.all()) {
      if (taskStatus.get(row.id) === row.status) continue;
      taskStatus.set(row.id, row.status);
      const record = JSON.parse(row.record) as {
        state?: { status: string; outcome?: { status?: string } };
        input?: { call?: { name?: string } };
      };
      const outcome = record.state?.outcome?.status ? ` (${record.state.outcome.status})` : "";
      log(`task   #${row.id} ${unquote(row.kind).padEnd(15)} ${row.status}${outcome}`);
    }
    for (const row of submissions.all()) {
      if (submissionStatus.get(row.id) === row.status) continue;
      submissionStatus.set(row.id, row.status);
      log(
        `submit #${row.id} ${row.request_id === null ? "(no requestId)" : unquote(row.request_id)} ${row.status}`,
      );
    }
  } catch (error) {
    log(`read failed, retrying: ${error instanceof Error ? error.message : String(error)}`);
  }
  await sleep(POLL_MS);
}
