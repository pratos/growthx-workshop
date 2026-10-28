-- Identity, event-sourced. stream_events is the engine's log (packages/engine/src/store.ts, EVENTS_TABLE); accounts and
-- sign_ins are the projection packages/domain/src/account/view.ts writes in the same batch. A test checks this file
-- against both, so the migration and the code cannot drift.
CREATE TABLE IF NOT EXISTS stream_events (stream TEXT NOT NULL, version INTEGER NOT NULL, type TEXT NOT NULL, data TEXT NOT NULL, issued_by TEXT NOT NULL, recorded_at TEXT NOT NULL, PRIMARY KEY (stream, version));
CREATE TABLE IF NOT EXISTS accounts (account_id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, admin INTEGER NOT NULL DEFAULT 0, password_hash TEXT NOT NULL, opened_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sign_ins (token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, signed_in_at TEXT NOT NULL, expires_at TEXT NOT NULL);
