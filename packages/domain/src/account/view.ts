import { stmt, type Projection } from '@greenhouse/engine';

// The read side of Identity, written in the same transaction as the events: who has an account, and which sign-ins are live.
export const accountsView: Projection = {
  name: 'accounts',
  tables: [
    'CREATE TABLE IF NOT EXISTS accounts (account_id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, admin INTEGER NOT NULL DEFAULT 0, password_hash TEXT NOT NULL, opened_at TEXT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS sign_ins (token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, signed_in_at TEXT NOT NULL, expires_at TEXT NOT NULL)',
  ],
  on(e) {
    const d = e.data as Record<string, string | boolean>;
    switch (e.type) {
      case 'AccountOpened': return [stmt('INSERT INTO accounts (account_id, email, name, admin, password_hash, opened_at) VALUES (?, ?, ?, ?, ?, ?)', d.accountId, d.email, d.name, d.admin ? 1 : 0, d.passwordHash, e.at)];
      case 'SignedIn':      return [stmt('INSERT INTO sign_ins (token_hash, account_id, signed_in_at, expires_at) VALUES (?, ?, ?, ?)', d.tokenHash, d.accountId, e.at, d.expiresAt)];
      case 'SignedOut':     return [stmt('DELETE FROM sign_ins WHERE token_hash = ?', d.tokenHash)];
      case 'AccountRenamed': return [stmt('UPDATE accounts SET name = ? WHERE account_id = ?', d.name, d.accountId)];
      default:              return [];
    }
  },
};
