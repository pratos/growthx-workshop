-- Accounts: who can sign in. Passwords are PBKDF2-SHA256 hashes ("pbkdf2$iterations$salt$hash"), never plain text.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                 -- the participant id commands and flags use
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Sessions: one row per sign-in. Only the SHA-256 of the token is stored, so a leaked table signs nobody in.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
