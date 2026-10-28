import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { EVENTS_TABLE } from '@greenhouse/engine';
import { accountsView } from '@greenhouse/domain';

// D1 tables are created by migrations, not by the engine's setup(). The DDL must be the same text in both places.
test('0002_accounts.sql creates exactly the engine log and the accounts projection', () => {
  const migration = readFileSync(new URL('../migrations/0002_accounts.sql', import.meta.url), 'utf8');
  for (const ddl of [EVENTS_TABLE, ...accountsView.tables]) expect(migration).toContain(`${ddl};`);
});
