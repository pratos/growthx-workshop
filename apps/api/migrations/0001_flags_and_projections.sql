-- Flags: behaviour switches evaluated in the API. Default off. A flag older than two releases is a lint error.
CREATE TABLE IF NOT EXISTS flags (
  name TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0,
  allowlist TEXT,
  percent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Cross-plan projection of decisions, rebuilt from plan streams by `just replay`; never written by hand.
CREATE TABLE IF NOT EXISTS decisions (
  plan_id TEXT NOT NULL, thread_id TEXT NOT NULL, block_id TEXT NOT NULL,
  decided_by TEXT NOT NULL, decided_at TEXT NOT NULL, decision TEXT NOT NULL,
  PRIMARY KEY (plan_id, thread_id)
);
